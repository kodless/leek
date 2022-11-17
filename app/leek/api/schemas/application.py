from schema import Schema, And, Or, Optional, Use

states = ["QUEUED", "RECEIVED", "STARTED", "SUCCEEDED", "RETRY", "REVOKED", "FAILED", "REJECTED"]

TriggerSchema = Schema({
    "enabled": And(bool),
    Optional("states", default=[]): [str],
    Optional("envs", default=[]): [str],
    Optional("runtime_upper_bound"): And(Use(float), lambda n: 0.000000000001 <= n <= 1000),
    Optional(Or("exclude", "include", only_one=True)): [str],
    "type": Or("slack"),
    "slack_wh_url": And(str, len),
})

ApplicationSchema = Schema(
    {
        "app_name": And(str, lambda e: e.isalpha() and e.islower()),
        "app_description": And(str, len),
        Optional("fo_triggers", default=[]): [],
        Optional("number_of_shards", default=1): And(Use(int), lambda n: 1 <= n <= 10),
        Optional("number_of_replicas", default=0): And(Use(int), lambda n: 0 <= n <= 1),
    }
)
