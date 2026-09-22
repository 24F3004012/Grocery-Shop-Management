from config import DISCOUNT_RATE, DISCOUNT_THRESHOLD
from routes.cart import CART, cart_total, display_cart
from routes.customer import collect_customer_details, create_bill


def checkout():
    if not CART:
        print("Your cart is empty. Add some items before checkout.")
        return False

    subtotal = cart_total()
    discount = subtotal * DISCOUNT_RATE if subtotal >= DISCOUNT_THRESHOLD else 0.0
    total = subtotal - discount

    print("\n=== Checkout ===")
    display_cart()
    print(f"Subtotal: ${subtotal:.2f}")
    if discount > 0:
        print(f"Discount ({DISCOUNT_RATE * 100:.0f}%): -${discount:.2f}")
    print(f"Total: ${total:.2f}")

    customer_data = collect_customer_details()

    try:
        payment = float(input("Enter amount paid: $"))
    except ValueError:
        print("Invalid payment amount.")
        return False

    if payment < total:
        print("Insufficient funds. Please enter a larger amount.")
        return False

    change = payment - total
    bill = create_bill(CART.copy(), subtotal, discount, total, payment, customer_data)
    print(f"Change: ${change:.2f}")
    print("Thank you for shopping with us!")
    print(f"Customer owes: ${bill['total_due']:.2f}")
    CART.clear()
    return True
