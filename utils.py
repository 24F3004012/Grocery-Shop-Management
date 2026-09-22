def get_valid_int(prompt, minimum=0):
    while True:
        raw_value = input(prompt).strip()
        try:
            value = int(raw_value)
        except ValueError:
            print("Please enter a valid whole number.")
            continue

        if value < minimum:
            print(f"Value must be at least {minimum}.")
            continue

        return value
