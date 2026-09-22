import os

from dotenv import load_dotenv
import psycopg

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

DEFAULT_PRODUCTS = {
    "apple": {"price": 0.75, "category": "Fruit", "stock": 25},
    "banana": {"price": 0.60, "category": "Fruit", "stock": 30},
    "milk": {"price": 2.25, "category": "Dairy", "stock": 18},
    "bread": {"price": 1.90, "category": "Bakery", "stock": 20},
    "eggs": {"price": 3.10, "category": "Dairy", "stock": 22},
    "rice": {"price": 4.50, "category": "Pantry", "stock": 12},
    "pasta": {"price": 2.80, "category": "Pantry", "stock": 15},
    "tomato": {"price": 1.10, "category": "Vegetable", "stock": 28},
    "lettuce": {"price": 1.35, "category": "Vegetable", "stock": 24},
    "water": {"price": 1.50, "category": "Beverage", "stock": 30},
}


def connect_db():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not configured. Add your Neon PostgreSQL connection string in a .env file."
        )

    conn = psycopg.connect(DATABASE_URL)
    return conn


def init_db():
    try:
        with connect_db() as conn:
            with conn.cursor() as cur:
                for category_name in sorted({details["category"] for details in DEFAULT_PRODUCTS.values()}):
                    cur.execute(
                        "INSERT INTO category (name) VALUES (%s) ON CONFLICT (name) DO NOTHING",
                        (category_name,),
                    )

                for name, details in DEFAULT_PRODUCTS.items():
                    cur.execute(
                        """
                        INSERT INTO product (category_id, name, unit_price, unit, stock_on_hand)
                        SELECT category_id, %s, %s, 'unit', %s
                        FROM category
                        WHERE name = %s
                          AND NOT EXISTS (SELECT 1 FROM product WHERE product.name = %s)
                        """,
                        (
                            name,
                            details["price"],
                            details["stock"],
                            details["category"],
                            name,
                        ),
                    )
    except RuntimeError:
        print("Neon database is not configured yet. Data will remain local until DATABASE_URL is set.")


def get_products():
    if not DATABASE_URL:
        return {}

    init_db()
    with connect_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT product.name, category.name, product.unit_price, product.stock_on_hand
                FROM product
                JOIN category ON category.category_id = product.category_id
                ORDER BY product.product_id
                """
            )
            rows = cur.fetchall()

    return {
        row[0]: {"category": row[1], "price": float(row[2]), "stock": row[3]}
        for row in rows
    }


def save_cash_session(customer_data, items, total_amount, cash_received):
    init_db()
    if not DATABASE_URL:
        return None

    with connect_db() as conn:
        with conn.cursor() as cur:
            customer_id = None
            if customer_data.get("name") or customer_data.get("phone"):
                cur.execute(
                    """
                    INSERT INTO customer (name, phone)
                    VALUES (%s, %s)
                    RETURNING customer_id
                    """,
                    (customer_data.get("name") or None, customer_data.get("phone") or None),
                )
                customer_id = cur.fetchone()[0]

            cur.execute(
                """
                INSERT INTO cash_session (
                    customer_id, transaction_time, total_amount, cash_received, change_given
                ) VALUES (%s, CURRENT_TIMESTAMP, %s, %s, %s)
                RETURNING session_id
                """,
                (customer_id, total_amount, cash_received, cash_received - total_amount),
            )
            session_id = cur.fetchone()[0]

            for product_name, quantity in items.items():
                cur.execute(
                    """
                    INSERT INTO cash_session_item (session_id, product_id, quantity, unit_price)
                    SELECT %s, product_id, %s, unit_price
                    FROM product
                    WHERE name = %s
                    """,
                    (session_id, quantity, product_name),
                )

            return session_id


def get_all_bills():
    init_db()
    if not DATABASE_URL:
        return []

    with connect_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT cash_session.session_id,
                       COALESCE(customer.name, 'Walk-in customer'),
                       customer.phone,
                       cash_session.total_amount,
                       cash_session.cash_received,
                       cash_session.change_given,
                       cash_session.transaction_time
                FROM cash_session
                LEFT JOIN customer ON customer.customer_id = cash_session.customer_id
                ORDER BY cash_session.session_id DESC
                """
            )
            rows = cur.fetchall()

    return [
        {
            "id": row[0],
            "customer_name": row[1],
            "customer_phone": row[2] or "",
            "total_due": float(row[3]),
            "amount_paid": float(row[4]),
            "change_amount": float(row[5]),
            "created_at": str(row[6]),
        }
        for row in rows
    ]
