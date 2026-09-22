from routes.inventory import INVENTORY, restore_stock, reduce_stock

CART = {}


def display_cart():
    if not CART:
        print("\nYour cart is empty.")
        return

    print("\n=== Your Cart ===")
    print(f"{'Item':<15} {'Qty':>5} {'Unit':>8} {'Total':>10}")
    print("-" * 45)
    total = 0.0
    for name, qty in CART.items():
        unit_price = INVENTORY[name]["price"]
        item_total = qty * unit_price
        total += item_total
        print(f"{name:<15} {qty:>5} ${unit_price:>6.2f} ${item_total:>8.2f}")
    print("-" * 45)
    print(f"{'Total':<15} {total:>27.2f}")


def add_item(product_name, quantity):
    if quantity <= 0:
        raise ValueError("Quantity must be greater than zero.")
    if quantity > INVENTORY[product_name]["stock"]:
        raise ValueError(f"Only {INVENTORY[product_name]['stock']} {product_name}(s) are available.")

    CART[product_name] = CART.get(product_name, 0) + quantity
    reduce_stock(product_name, quantity)
    return f"Added {quantity} {product_name}(s) to your cart."


def update_item(product_name, new_quantity):
    if new_quantity < 0:
        raise ValueError("Quantity cannot be negative.")

    current_quantity = CART.get(product_name, 0)
    stock_delta = new_quantity - current_quantity

    if stock_delta > 0 and stock_delta > INVENTORY[product_name]["stock"]:
        raise ValueError(f"Only {INVENTORY[product_name]['stock']} {product_name}(s) are available in stock.")

    if stock_delta != 0:
        if stock_delta > 0:
            reduce_stock(product_name, stock_delta)
        else:
            restore_stock(product_name, abs(stock_delta))

    if new_quantity == 0:
        del CART[product_name]
        return f"Removed {product_name} from your cart."

    CART[product_name] = new_quantity
    return f"Updated {product_name} quantity to {new_quantity}."


def remove_item(product_name):
    if product_name not in CART:
        raise ValueError(f"{product_name} is not in your cart.")

    restore_stock(product_name, CART[product_name])
    del CART[product_name]
    return f"Removed {product_name} from your cart."


def cart_total():
    total = 0.0
    for name, quantity in CART.items():
        total += INVENTORY[name]["price"] * quantity
    return total
