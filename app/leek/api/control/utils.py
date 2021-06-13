import json

SUBSCRIPTIONS_FILE = "/opt/app/conf/subscriptions.json"


def get_subscription(subscription_name):
    with open(SUBSCRIPTIONS_FILE) as json_file:
        subscriptions = json.load(json_file)
    return subscriptions.get(subscription_name)
