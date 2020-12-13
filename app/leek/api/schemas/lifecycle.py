from schema import Schema, And, Use

LifecycleSchema = Schema(
    {
        "hot_max_size": And(Use(int), lambda n: 0 <= n <= 1000),
        "hot_max_age": And(Use(int), lambda n: 10 <= n <= 30),
        "warm_age": And(Use(int), lambda n: 0 <= n <= 1000),
        "cold_age": And(Use(int), lambda n: 0 <= n <= 1000),
        "delete_age": And(Use(int), lambda n: 0 <= n <= 1000),
    }
)
