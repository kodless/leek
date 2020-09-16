import random
import string

from .conf import settings


def generate_api_key(length=48):
    if settings.ENV == "DEV":
        return "secret"
    letters_and_digits = string.ascii_letters + string.digits
    return ''.join((random.choice(letters_and_digits) for i in range(length)))
