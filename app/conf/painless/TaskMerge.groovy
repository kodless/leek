String QUEUED = "QUEUED";
String RECEIVED = "RECEIVED";
String STARTED = "STARTED";
String SUCCEEDED = "SUCCEEDED";
String FAILED = "FAILED";
String REJECTED = "REJECTED";
String REVOKED = "REVOKED";
String RETRY = "RETRY";

// CUSTOM STATES
String RECOVERED = "RECOVERED"; // Succeeded after many retries
String CRITICAL = "CRITICAL";  // Failed after max retries

List STATES_TERMINAL = [SUCCEEDED, FAILED, REJECTED, REVOKED, RECOVERED, CRITICAL];
List STATES_SUCCESS = [SUCCEEDED, RECOVERED];
List STATES_EXCEPTION = [FAILED, RETRY, REJECTED, REVOKED, CRITICAL];
List STATES_UNREADY = [QUEUED, RECEIVED, STARTED];

Map TaskStateFields = [
    // No need to update this fields if coming task is out of order
    "SHARED": ["_id", "app_env", "kind", "state", "uuid", "clock", "timestamp", "exact_timestamp", "utcoffset", "pid"],

    // Shared between states
    "QUEUED_RECEIVED": ["name", "args", "kwargs", "root_id", "parent_id", "eta", "expires", "retries"],
    "FAILED_RETRY": ["exception", "traceback"],

    // Safe
    "NOT_QUEUED": ["worker"],
    "QUEUED": ["queued_at", "exchange", "routing_key", "queue", "client"],
    "RECEIVED": ["received_at"],
    "STARTED": ["started_at"],
    "RETRY": ["retried_at"],

    // TERMINAL STATES
    "SUCCEEDED": ["succeeded_at", "result", "runtime"],
    "FAILED": ["failed_at"],
    "REJECTED": ["rejected_at", "requeue"],
    "REVOKED": ["revoked_at", "terminated", "expired", "signum"]
];

int events_count = ctx._source.events_count;
List events = ctx._source.events;
List attrs_to_upsert = [];

if (ctx._source.uuid == null || STATES_TERMINAL.contains(params.state)) {
    // First time to index or Coming event in terminal state and safe to merge
    // No need to compare clocks/timestamps
    for (def entry : params.entrySet()) {
        if (entry.getValue() != null) {
            ctx._source[entry.getKey()] = entry.getValue();
        }
    }
}
else if (STATES_TERMINAL.contains(ctx._source.state)) {
    // The task is already in terminal state, Resolve conflict and merge
    // This can be caused if the timestamp of the new event is inaccurate
    // Or if the workers/clients are not synchronized

    // Get safe attrs from coming task
    attrs_to_upsert.addAll(TaskStateFields[params.state]);
    // States with same attrs
    if (params.state == RETRY){
        if (![FAILED, CRITICAL].contains(ctx._source.state)){
            // Retry event came late => update document with traceback/exception
            attrs_to_upsert.addAll(TaskStateFields.FAILED_RETRY);
        }
    }
    else if ([QUEUED, RECEIVED].contains(params.state)) {
        // QUEUED|RECEIVED event came late, update with attrs send only by QUEUED|RECEIVED events
        attrs_to_upsert.addAll(TaskStateFields.QUEUED_RECEIVED);
    }
    // Merge
    for (def entry : params.entrySet()) {
        if (entry.getValue() != null && attrs_to_upsert.contains(entry.getKey())) {
            ctx._source[entry.getKey()] = entry.getValue();
        }
    }
}
else {
    // Handle non terminal events (Resolve conflict and merge or Just merge)
    boolean in_order = ctx._source.exact_timestamp < params.exact_timestamp;
    if (in_order) {
        // The two documents are in physical clock order and in state order, Safe to merge
        for (def entry : params.entrySet()) {
            if (entry.getValue() != null) {
                ctx._source[entry.getKey()] = entry.getValue();
            }
        }
    }
    else if (ctx._source.state == params.state) {
        // The two documents are out of order and has the same state => Skip
        ctx.op = 'none';
    }
    else {
        // The two documents are out of order and has different states => Resolve conflict and merge

        // Get safe attrs from coming task
        attrs_to_upsert.addAll(TaskStateFields[params.state]);
        // States with same attrs
        if (params.state == RETRY) {
            if (ctx._source.state != RETRY) {
                attrs_to_upsert.addAll(TaskStateFields.FAILED_RETRY);
            }
        }
        else if ([QUEUED, RECEIVED].contains(params.state)) {
            if (![QUEUED, RECEIVED].contains(ctx._source.state)) {
                attrs_to_upsert.addAll(TaskStateFields.QUEUED_RECEIVED);
            }
        }
        // Merge
        for (def entry : params.entrySet()) {
            if (entry.getValue() != null && attrs_to_upsert.contains(entry.getKey())) {
                ctx._source[entry.getKey()] = entry.getValue();
            }
        }
    }
}

// Introduce custom states
if (ctx._source.retries != null && ctx._source.retries > 0) {
    if (ctx._source.state == FAILED) {
        ctx._source.state = CRITICAL;
    }
    else if (ctx._source.state == SUCCEEDED) {
        ctx._source.state = RECOVERED;
    }
}

// If parent/root is self fix
if (ctx._source.root_id != null && ctx._source.root_id.equals(ctx._source.id) ) {
    ctx._source.root_id = null;
}
if (ctx._source.parent_id != null && ctx._source.parent_id.equals(ctx._source.id) ) {
    ctx._source.parent_id = null;
}

// Increment events count
ctx._source.events_count = events_count + 1;
events.add(params.state);
ctx._source.events = events;
