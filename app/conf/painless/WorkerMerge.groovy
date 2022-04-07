Map WorkerStateFields = [
        // No need to update this fields if coming task is out of order
        "SHARED"   : [
                "_id", "app_env", "kind", "state", "hostname", "clock", "timestamp", "exact_timestamp", "utcoffset", "pid",
                "sw_ident", "sw_ver", "sw_sys"
        ],
        // Safe
        "ONLINE"   : ["online_at"],
        "HEARTBEAT": ["last_heartbeat_at", "processed", "active", "freq", "loadavg"],
        "OFFLINE"  : ["offline_at"]
];

int events_count = ctx._source.events_count;
int new_events_count = params.events_count;
boolean in_order = ctx._source.exact_timestamp < params.exact_timestamp;
List attrs_to_upsert = [];

if (in_order) {
    // The two documents are in order, Safe to merge
    for (def entry : params.entrySet()) {
        if (entry.getValue() != null) {
            ctx._source[entry.getKey()] = entry.getValue();
        }
    }
} else if (!in_order && ctx._source.state == params.state) {
    // The two documents are out of order and has the same state => Skip
    ctx.op = 'none';
} else {
    // The two documents are out of order and has different states => Resolve conflict and merge

    // Get safe attrs from coming worker event
    attrs_to_upsert.addAll(WorkerStateFields[params.state]);
    // Merge
    for (def entry : params.entrySet()) {
        if (entry.getValue() != null && attrs_to_upsert.contains(entry.getKey())) {
            ctx._source[entry.getKey()] = entry.getValue();
        }
    }
}

ctx._source.events_count = events_count + new_events_count;
