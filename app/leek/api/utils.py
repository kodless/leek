import random
import string


def generate_app_key(length=48):
    letters_and_digits = string.ascii_letters + string.digits
    return f"app-{''.join((random.choice(letters_and_digits) for i in range(length)))}"
