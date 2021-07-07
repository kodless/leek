from schema import Schema, And, Optional, Or

RevocationSchema = Schema({
    Optional("terminate", default=False): And(bool),
    Optional("signal", default="SIGTERM"): Or("SIGTERM", "SIGKILL"),
})
