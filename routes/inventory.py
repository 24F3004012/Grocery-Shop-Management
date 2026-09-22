from routes.products import DEFAULT_PRODUCTS, get_products


INVENTORY = {name: details.copy() for name, details in DEFAULT_PRODUCTS.items()}


def refresh_inventory():
    database_inventory = get_products()
    if database_inventory:
        INVENTORY.clear()
        INVENTORY.update(database_inventory)
    return INVENTORY


refresh_inventory()


def show_inventory():
    print("\n=== Grocery Store Inventory ===")
    print(f"{'#':<3} {'Item':<15} {'Category':<12} {'Price':>8} {'Stock':>8}")
    print("-" * 52)
    for index, (name, details) in enumerate(INVENTORY.items(), start=1):
        print(f"{index:<3} {name:<15} {details['category']:<12} ${details['price']:>6.2f}  {details['stock']:>5}")


def find_product_key(name_or_index):
    if isinstance(name_or_index, int):
        names = list(INVENTORY.keys())
        if 1 <= name_or_index <= len(names):
            return names[name_or_index - 1]
        return None

    lookup = name_or_index.strip().lower()
    for item_name in INVENTORY:
        if item_name.lower() == lookup:
            return item_name
    return None


def reduce_stock(product_name, quantity):
    INVENTORY[product_name]["stock"] -= quantity


def restore_stock(product_name, quantity):
    INVENTORY[product_name]["stock"] += quantity
