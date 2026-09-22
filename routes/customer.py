from routes.database import DATABASE_URL, connect_db
from routes.triggers import insert_cash_items, insert_credit_sale_items


def create_customer(name, phone):
    with connect_db() as conn:
        return conn.execute(
            "INSERT INTO customer (name, phone) VALUES (%s, %s) RETURNING customer_id",
            (name or None, phone or None),
        ).fetchone()[0]


def get_customers():
    if not DATABASE_URL:
        return []

    with connect_db() as conn:
        return conn.execute(
            "SELECT customer_id, name, phone, balance_due FROM customer ORDER BY customer_id"
        ).fetchall()


def save_cash_session(customer_data, items, total_amount, cash_received):
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
            insert_cash_items(cur, session_id, items)
            return session_id


def get_all_cash_sessions():
    if not DATABASE_URL:
        return []

    with connect_db() as conn:
        rows = conn.execute(
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
        ).fetchall()

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


def collect_customer_details():
    print("\n=== Customer Details ===")
    return {
        "name": input("Enter customer name: ").strip(),
        "phone": input("Enter customer phone: ").strip(),
    }


def create_bill(items, subtotal, discount, total, payment, customer_data):
    save_cash_session(customer_data, items, total, payment)
    return {
        "customer": customer_data,
        "subtotal": subtotal,
        "discount": discount,
        "total_due": total,
        "amount_paid": payment,
        "change": payment - total,
    }


def show_bill_history():
    sessions = get_all_cash_sessions()
    if not sessions:
        print("No cash transactions recorded yet.")
        return

    print("\n=== Cash Transaction History ===")
    for session in sessions:
        print(f"\nTransaction #{session['id']}")
        print(f"Customer: {session['customer_name']}")
        print(f"Phone: {session['customer_phone']}")
        print(f"Total: ${session['total_due']:.2f}")
        print(f"Cash received: ${session['amount_paid']:.2f}")
        print(f"Change: ${session['change_amount']:.2f}")
        print(f"Date: {session['created_at']}")


def record_credit_sale(customer_id, items):
    total_amount = sum(quantity * unit_price for _, quantity, unit_price in items)
    with connect_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO credit_sale (customer_id, transaction_time, total_amount)
                VALUES (%s, CURRENT_TIMESTAMP, %s)
                RETURNING credit_id
                """,
                (customer_id, total_amount),
            )
            credit_id = cur.fetchone()[0]
            insert_credit_sale_items(cur, credit_id, items)
            return credit_id, total_amount


def record_credit_payment(customer_id, amount_paid, note):
    with connect_db() as conn:
        return conn.execute(
            """
            INSERT INTO credit_payment (customer_id, payment_date, amount_paid, note)
            VALUES (%s, CURRENT_DATE, %s, %s)
            RETURNING payment_id
            """,
            (customer_id, amount_paid, note or None),
        ).fetchone()[0]
