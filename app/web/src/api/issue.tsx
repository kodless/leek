import {TaskFilters, getTimeFilterQuery} from "./task";
import {search} from "./search";

export interface Issue {
    filter(
        app_name: string,
        app_env: string | undefined,
        filters: TaskFilters,
    ): any;
}

export class IssueService implements Issue {
    filter(
        app_name: string,
        app_env: string | undefined,
        filters: TaskFilters,
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