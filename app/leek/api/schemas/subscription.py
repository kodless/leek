from schema import Schema, And, Optional, Use

SubscriptionSchema = Schema({
    "broker": And(str, len),
    "broker_management_url": And(str, len),
    Optional("backend"): And(str, len),
    "app_env": And(str, lambda e: e.isalpha() and e.islower()),
    # --
    Optional("exchange", default="celeryev"): And(str, len),
    Optional("queue", default="leek.fanout"): And(str, len),
    Optional("routing_key", default="#"): And(str, len),
    Optional("prefetch_count", default=1000): And(Use(int), lambda n: 1000 <= n <= 10000),
    Optional("concurrency_pool_size", default=1): And(Use(int), lambda n: 1 <= n <= 20),
    # -- Batch
    Optional("batch_max_size_in_mb", default=1): And(Use(int), lambda n: 1 <= n <= 10),
    Optional("batch_max_number_of_messages", default=1000): And(Use(int), lambda n: 1000 <= n <= 10000),
    Optional("batch_max_window_in_seconds", default=5): And(Use(int), lambda n: 5 <= n <= 20),
})
