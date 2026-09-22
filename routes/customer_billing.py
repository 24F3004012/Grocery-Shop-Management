from routes.database import get_all_bills, save_cash_session

CUSTOMER_DETAILS = {
    "name": "",
    "phone": "",
}


def collect_customer_details():
    print("\n=== Customer Details ===")
    CUSTOMER_DETAILS["name"] = input("Enter customer name: ").strip()
    CUSTOMER_DETAILS["phone"] = input("Enter customer phone: ").strip()

    return CUSTOMER_DETAILS.copy()


def create_bill(items, subtotal, discount, total, payment):
    customer_data = CUSTOMER_DETAILS.copy()
    bill = {
        "customer": customer_data,
        "subtotal": subtotal,
        "discount": discount,
        "total_due": total,
        "amount_paid": payment,
        "change": payment - total,
    }
    save_cash_session(customer_data, items, total, payment)
    return bill


def show_bill_history():
    bills = get_all_bills()
    if not bills:
        print("No bills recorded yet.")
        return

    print("\n=== Bill History ===")
    for bill in bills:
        print(f"\nBill #{bill['id']}")
        print(f"Customer: {bill['customer_name']}")
        print(f"Phone: {bill['customer_phone']}")
        print(f"Total due: ${bill['total_due']:.2f}")
        print(f"Amount paid: ${bill['amount_paid']:.2f}")
        print(f"Change: ${bill['change_amount']:.2f}")
        print(f"Date: {bill['created_at']}")
