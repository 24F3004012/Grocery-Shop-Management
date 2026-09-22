from routes.database import DATABASE_URL, connect_db
from routes.triggers import insert_purchase_items


def get_suppliers():
    if not DATABASE_URL:
        return []

    with connect_db() as conn:
        return conn.execute(
            "SELECT supplier_id, name, phone FROM supplier ORDER BY supplier_id"
        ).fetchall()


def create_supplier(name, phone):
    with connect_db() as conn:
        return conn.execute(
            "INSERT INTO supplier (name, phone) VALUES (%s, %s) RETURNING supplier_id",
            (name, phone or None),
        ).fetchone()[0]


def record_purchase(supplier_id, items):
    total_amount = sum(quantity * unit_cost for _, quantity, unit_cost in items)
    with connect_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO purchase (supplier_id, purchase_date, total_amount)
                VALUES (%s, CURRENT_DATE, %s)
                RETURNING purchase_id
                """,
                (supplier_id, total_amount),
            )
            purchase_id = cur.fetchone()[0]
            insert_purchase_items(cur, purchase_id, items)
            return purchase_id, total_amount
