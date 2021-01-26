from schema import Schema, And, Optional

SubscriptionSchema = Schema({
    "name": And(str, len),
    "broker": And(str, len),
    Optional("backend"): And(str, len),
    "app_env": And(str, len),
    # --
    Optional("exchange", default="celeryev"): And(str, len),
    Optional("queue", default="leek.fanout"): And(str, len),
    Optional("routing_key", default="#"): And(str, len),
})
