from routes.database import connect_db

TRIGGER_NAMES = (
    "purchase_item_stock_trigger",
    "cash_session_item_stock_trigger",
    "credit_sale_item_stock_trigger",
    "credit_sale_balance_trigger",
    "credit_payment_balance_trigger",
)


def verify_triggers():
    """Return installed Neon trigger names for an owner health check."""
    with connect_db() as conn:
        rows = conn.execute(
            """
            SELECT trigger_name
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
              AND trigger_name = ANY(%s)
            GROUP BY trigger_name
            ORDER BY trigger_name
            """,
            (list(TRIGGER_NAMES),),
        ).fetchall()
    return [row[0] for row in rows]


def insert_cash_items(cursor, session_id, items):
    for product_name, quantity in items.items():
        cursor.execute(
            """
            INSERT INTO cash_session_item (session_id, product_id, quantity, unit_price)
            SELECT %s, product_id, %s, unit_price
            FROM product
            WHERE name = %s
            """,
            (session_id, quantity, product_name),
        )
        if cursor.rowcount != 1:
            raise ValueError(f"Product '{product_name}' no longer exists in Neon.")


def insert_purchase_items(cursor, purchase_id, items):
    for product_name, quantity, unit_cost in items:
        cursor.execute(
            """
            INSERT INTO purchase_item (purchase_id, product_id, quantity, unit_cost)
            SELECT %s, product_id, %s, %s
            FROM product
            WHERE name = %s
            """,
            (purchase_id, quantity, unit_cost, product_name),
        )
        if cursor.rowcount != 1:
            raise ValueError(f"Product '{product_name}' does not exist in Neon.")


def insert_credit_sale_items(cursor, credit_id, items):
    for product_name, quantity, unit_price in items:
        cursor.execute(
            """
            INSERT INTO credit_sale_item (credit_id, product_id, quantity, unit_price)
            SELECT %s, product_id, %s, %s
            FROM product
            WHERE name = %s
            """,
            (credit_id, quantity, unit_price, product_name),
        )
        if cursor.rowcount != 1:
            raise ValueError(f"Product '{product_name}' no longer exists in Neon.")
