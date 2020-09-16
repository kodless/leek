from schema import Schema, And, Optional, Use

SearchParamsSchema = Schema(
    {
        Optional("size", default=0): And(Use(int), lambda n: 0 <= n <= 1000),
        Optional("from_", default=0): And(Use(int), lambda n: 0 <= n <= 1000),
    }
)
