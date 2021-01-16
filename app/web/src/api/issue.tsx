import {TaskFilters, getFilterQuery} from "./task";
import {search} from "./search";

export interface Issue {
    filter(
        app_name: string,
        app_env: string | undefined,
        order: string | "desc",
        filters: TaskFilters,
    ): any;
}

export class IssueService implements Issue {
    filter(
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
                    exceptions: {
                        terms: {field: "exception.keyword"},
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