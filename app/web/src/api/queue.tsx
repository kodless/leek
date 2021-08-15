import {search, getTimeFilterQuery, TimeFilters} from "./search";

export interface Queue {
    filter(
        app_name: string,
        app_env: string | undefined,
        filters: TimeFilters,
    ): any;
}

export class QueueService implements Queue {
    filter(
        app_name: string,
        app_env: string | undefined,
        filters: TimeFilters,
    ) {
        let query = [getTimeFilterQuery(filters),];
        if (app_env)
            query.push({"match": {"app_env": app_env}});
        return search(
            app_name,
            {
                query: {
                    "bool": {
                        "must": query.filter(Boolean)
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