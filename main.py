from config import APP_NAME
from routes.inventory import find_product_key, show_inventory
from routes.cart import CART, display_cart, add_item, update_item, remove_item
from routes.checkout import checkout
from routes.customer import show_bill_history
from routes.owner import (
    add_new_product,
    purchase_stock,
    record_credit_sale_flow,
    record_payment_flow,
    show_customers,
    show_suppliers,
)
from utils import get_valid_int


def add_to_cart():
    show_inventory()
    item_name = input("\nEnter item name or number to add: ").strip()

    if item_name.isdigit():
        product_key = find_product_key(int(item_name))
    else:
        product_key = find_product_key(item_name)

    if product_key is None:
        print("Invalid item selection.")
        return

    quantity = get_valid_int(f"How many {product_key}s would you like to add? ", minimum=1)

    try:
        print(add_item(product_key, quantity))
    except ValueError as exc:
        print(exc)


def update_cart():
    if not CART:
        print("Your cart is empty.")
        return

    display_cart()
    item_name = input("\nEnter the item name to update quantity: ").strip().lower()
    product_key = next((name for name in CART if name.lower() == item_name), None)

    if product_key is None:
        print("That item is not in your cart.")
        return

    new_quantity = get_valid_int(f"Enter new quantity for {product_key}: ", minimum=0)

    try:
        print(update_item(product_key, new_quantity))
    except ValueError as exc:
        print(exc)


def remove_from_cart():
    if not CART:
        print("Your cart is empty.")
        return

    display_cart()
    item_name = input("\nEnter the item name to remove: ").strip().lower()
    product_key = next((name for name in CART if name.lower() == item_name), None)

    if product_key is None:
        print("That item is not in your cart.")
        return

    try:
        print(remove_item(product_key))
    except ValueError as exc:
        print(exc)


def show_menu():
    print(f"\nWelcome to {APP_NAME}!")
    print("1. View inventory")
    print("2. Add item to cart")
    print("3. Update cart quantity")
    print("4. Remove item from cart")
    print("5. View cart")
    print("6. Checkout")
    print("7. View bill history")
    print("8. Record stock purchase")
    print("9. Record credit sale")
    print("10. Record credit payment")
    print("11. Add product")
    print("12. View customers")
    print("13. View suppliers")
    print("14. Exit")


def main():
    while True:
        show_menu()
        choice = input("Choose an option: ").strip()

        actions = {
            "1": lambda: show_inventory(),
            "2": add_to_cart,
            "3": update_cart,
            "4": remove_from_cart,
            "5": lambda: display_cart(),
            "6": checkout,
            "7": show_bill_history,
            "8": purchase_stock,
            "9": record_credit_sale_flow,
            "10": record_payment_flow,
            "11": add_new_product,
            "12": show_customers,
            "13": show_suppliers,
            "14": lambda: print(f"Thanks for visiting {APP_NAME}. Have a great day!") or False,
        }

        action = actions.get(choice)
        if action is None:
            print("Invalid option. Please try again.")
            continue

        should_exit = action()
        if choice == "14":
            break
        if should_exit is False:
            continue


if __name__ == "__main__":
    main()
