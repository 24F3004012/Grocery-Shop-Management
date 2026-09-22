from routes.customer import (
    create_customer,
    get_customers,
    record_credit_payment,
    record_credit_sale,
)
from routes.inventory import INVENTORY, refresh_inventory, show_inventory
from routes.products import add_product
from routes.supplier import create_supplier, get_suppliers, record_purchase
from utils import get_valid_int


def _collect_items(price_prompt):
    items = []
    show_inventory()
    print("Enter a blank product name when finished.")

    while True:
        product_name = input("Product name or number: ").strip().lower()
        if not product_name:
            return items

        if product_name.isdigit():
            index = int(product_name)
            names = list(INVENTORY)
            product_name = names[index - 1] if 1 <= index <= len(names) else ""

        if product_name not in INVENTORY:
            print("That product was not found.")
            continue

        quantity = get_valid_int("Quantity: ", minimum=1)
        try:
            unit_price = float(input(f"{price_prompt} for {product_name}: $"))
        except ValueError:
            print("Enter a valid amount.")
            continue
        if unit_price < 0:
            print("Amount cannot be negative.")
            continue
        items.append((product_name, quantity, unit_price))


def purchase_stock():
    print("\n=== Record Stock Purchase ===")
    for supplier_id, name, phone in get_suppliers():
        print(f"{supplier_id}. {name} ({phone or 'no phone'})")

    choice = input("Supplier ID, or N for a new supplier: ").strip().lower()
    if choice == "n":
        supplier_id = create_supplier(input("Supplier name: ").strip(), input("Supplier phone: ").strip())
    else:
        try:
            supplier_id = int(choice)
        except ValueError:
            print("Invalid supplier selection.")
            return

    items = _collect_items("Unit cost")
    if not items:
        print("No purchase recorded.")
        return

    purchase_id, total = record_purchase(supplier_id, items)
    refresh_inventory()
    print(f"Purchase #{purchase_id} recorded for ${total:.2f}.")


def _select_customer(create_if_empty=True):
    customers = get_customers()
    for customer_id, name, phone, balance_due in customers:
        print(f"{customer_id}. {name or 'Unnamed'} | {phone or 'no phone'} | Owes ${float(balance_due):.2f}")

    if not customers and not create_if_empty:
        print("No customers found.")
        return None

    choice = input("Customer ID, or N for a new customer: ").strip().lower()
    if choice == "n":
        return create_customer(input("Customer name: ").strip(), input("Customer phone: ").strip())

    try:
        return int(choice)
    except ValueError:
        print("Invalid customer selection.")
        return None


def record_credit_sale_flow():
    print("\n=== Record Credit Sale ===")
    customer_id = _select_customer()
    if customer_id is None:
        return
    items = _collect_items("Unit price")
    if not items:
        print("No credit sale recorded.")
        return

    credit_id, total = record_credit_sale(customer_id, items)
    refresh_inventory()
    print(f"Credit sale #{credit_id} recorded. Customer owes ${total:.2f}.")


def record_payment_flow():
    print("\n=== Record Credit Payment ===")
    customer_id = _select_customer(create_if_empty=False)
    if customer_id is None:
        return

    try:
        amount = float(input("Payment amount: $"))
    except ValueError:
        print("Enter a valid amount.")
        return
    if amount <= 0:
        print("Payment must be greater than zero.")
        return

    payment_id = record_credit_payment(customer_id, amount, input("Note (optional): ").strip())
    print(f"Payment #{payment_id} recorded.")


def add_new_product():
    name = input("Product name: ").strip().lower()
    category = input("Category: ").strip()
    unit = input("Unit (kg, pack, bottle): ").strip()
    try:
        price = float(input("Selling price: $"))
        reorder_level = get_valid_int("Reorder level: ", minimum=0)
        product_id = add_product(name, category, price, unit, reorder_level)
    except ValueError:
        print("Enter valid numeric values.")
        return
    refresh_inventory()
    print(f"Product #{product_id} added.")


def show_customers():
    print("\n=== Customers ===")
    for customer_id, name, phone, balance_due in get_customers():
        print(f"#{customer_id}: {name or 'Unnamed'} | {phone or 'no phone'} | Balance due: ${float(balance_due):.2f}")


def show_suppliers():
    print("\n=== Suppliers ===")
    for supplier_id, name, phone in get_suppliers():
        print(f"#{supplier_id}: {name} | {phone or 'no phone'}")
