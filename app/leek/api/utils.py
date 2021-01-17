import random
import string

import requests

from leek.api.db.store import FanoutTrigger


def generate_app_key(length=48):
    letters_and_digits = string.ascii_letters + string.digits
    return f"app-{''.join((random.choice(letters_and_digits) for i in range(length)))}"


def init_trigger(tr, app_name):
    print(tr)
    trigger = FanoutTrigger(**tr)
    if trigger.slack_wh_url:
        text = f"Leek trigger configured for application `{app_name}`:\n" \
               f"- *enabled*: {trigger.enabled}\n" \
               f"- *envs*: {trigger.envs}\n" \
               f"- *states*: {trigger.states}\n" \
               f"- *exclude*: {trigger.exclude}\n" \
               f"- *include*: {trigger.include}\n" \
               f"- *runtime upper bound*: {trigger.runtime_upper_bound} seconds"
        try:
            response = requests.post(
                url=trigger.slack_wh_url,
                json={"text": text},
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()  # Raises a HTTPError if the status is 4xx, 5xxx
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            return False
        except requests.exceptions.HTTPError as e:
            return False
    return True


def has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)
