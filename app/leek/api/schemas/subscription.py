from schema import Schema, And, Optional, Use

SubscriptionSchema = Schema({
    "name": And(str, len),
    "broker": And(str, len),
    Optional("backend"): And(str, len),
    "app_env": And(str, len),
    # --
    Optional("exchange", default="celeryev"): And(str, len),
    Optional("queue", default="leek.fanout"): And(str, len),
    Optional("routing_key", default="#"): And(str, len),
    Optional("prefetch_count", default=1000): And(Use(int), lambda n: 1000 <= n <= 10000),
    Optional("concurrency_pool_size", default=1): And(Use(int), lambda n: 1 <= n <= 20),
})
