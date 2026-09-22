from routes.database import get_products


INVENTORY = {
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


database_inventory = get_products()
if database_inventory:
    INVENTORY = database_inventory


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
