from routes.database import connect_db, DATABASE_URL

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


def seed_default_products():
    if not DATABASE_URL:
        return

    with connect_db() as conn:
        with conn.cursor() as cur:
            categories = sorted({details["category"] for details in DEFAULT_PRODUCTS.values()})
            for category_name in categories:
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
                    (name, details["price"], details["stock"], details["category"], name),
                )


def get_products():
    if not DATABASE_URL:
        return {}

    seed_default_products()
    with connect_db() as conn:
        rows = conn.execute(
            """
            SELECT product.name, category.name, product.unit_price, product.stock_on_hand
            FROM product
            JOIN category ON category.category_id = product.category_id
            ORDER BY product.product_id
            """
        ).fetchall()

    return {
        row[0]: {"category": row[1], "price": float(row[2]), "stock": row[3]}
        for row in rows
    }


def add_product(name, category_name, unit_price, unit, reorder_level=0):
    with connect_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO category (name) VALUES (%s) ON CONFLICT (name) DO NOTHING",
                (category_name,),
            )
            cur.execute(
                """
                INSERT INTO product (category_id, name, unit_price, unit, reorder_level)
                SELECT category_id, %s, %s, %s, %s
                FROM category
                WHERE name = %s
                RETURNING product_id
                """,
                (name, unit_price, unit, reorder_level, category_name),
            )
            return cur.fetchone()[0]
