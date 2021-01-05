import {TaskFilters, getFilterQuery} from "./task";
import {search} from "./search";

const state_timestamp_map = {
    QUEUED: "queued_at",
    RECEIVED: "received_at",
    STARTED: "started_at",
    SUCCEEDED: "succeeded_at",
    FAILED: "failed_at",
    REJECTED: "rejected_at",
    REVOKED: "revoked_at",
    RETRY: "retried_at",
};

export interface Monitor {
    charts(
        app_name: string,
        app_env: string | undefined,
        order: string | "desc",
        filters: TaskFilters,
    ): any;
}

export class MonitorSearch implements Monitor {
    charts(
        app_name: string,
        app_env: string | undefined,
        order: string | "desc",
        filters: TaskFilters,
    ) {
        return search(
            app_name,
            {
                query: {
                    "bool": {
                        "must": getFilterQuery(app_env, filters)
                    }
                },
                sort: [
                    {"timestamp": {"order": order}},
                ],
                aggs: {
                    tasksDistribution: {
                        "terms": {"field": "name"},
                        aggs: {
                            statesDistribution: {
                                "terms": {"field": "state"}
                            },
                            runtimeDistribution: {"avg": {"field": "runtime"}}
                        }
                    },
                    statesDistribution: {
                        "terms": {"field": "state"}
                    },
                    queuesDistribution: {
                        "terms": {"field": "queue"}
                    },
                    timeDistribution: {
                        "auto_date_histogram": {
                            "field": "timestamp",
                            "buckets": 30,
                        }
                    },
                }
            },
            {
                size: 0,
                from_: 0
            }
        )
    }
}