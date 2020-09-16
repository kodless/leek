from schema import Schema, And, Or, Optional, Use

states = ["RECEIVED", "SENT", "STARTED", "SUCCEEDED", "RETRY", "REVOKED", "FAILED", "REJECTED"]

TriggerSchema = Schema({
    "enabled": And(bool),
    "states": [str],
    "envs": [str],
    Optional("runtime_upper_bound"): And(Use(float), lambda n: 0.000000000001 <= n <= 1000),
    Optional(Or("exclude", "include", only_one=True)): [str],
    "type": Or("slack"),
    "slack_wh_url": And(str, len),
})

ApplicationSchema = Schema(
    {
        "app_name": And(str, len),
        "app_description": And(str, len),
        "broker": And(str, len),
        "broker_version": And(str, len),
        Optional("fo_triggers", default=[]): []
    }
)
