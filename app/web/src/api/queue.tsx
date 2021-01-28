import {TaskFilters, getTimeFilterQuery} from "./task";
import {search} from "./search";

export interface Queue {
    filter(
        app_name: string,
        app_env: string | undefined,
        filters: TaskFilters,
    ): any;
}

export class QueueService implements Queue {
    filter(
        app_name: string,
        app_env: string | undefined,
        filters: TaskFilters,
    ) {
        return search(
            app_name,
            {
                query: {
                    "bool": {
                        "must": [getTimeFilterQuery(filters)].filter(Boolean)
                    }
                },
                aggs: {
                    queues: {
                        terms: {field: "queue"},
                        aggs: {
                            state: {
                                terms: {field: "state"}
                            },
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