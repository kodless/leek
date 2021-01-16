import {TaskFilters, getFilterQuery} from "./task";
import {search} from "./search";

export interface Stats {
    charts(
        app_name: string,
        app_env: string | undefined,
        order: string | "desc",
        filters: TaskFilters,
        timeDistributionTSType: string
    ): any;
}

export class StatsService implements Stats {
    charts(
        app_name: string,
        app_env: string | undefined,
        order: string | "desc",
        filters: TaskFilters,
        timeDistributionTSType
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
                    statesDistribution: {"terms": {"field": "state"}}, // Chart: States distribution
                    queuesDistribution: {"terms": {"field": "queue"}}, // Chart: Queues distribution
                    tasksDistribution: {
                        "terms": {"field": "name"}, // Chart: TOP 5 Executed Tasks
                        aggs: {
                            statesDistribution: {"terms": {"field": "state"}}, // Bar subsets
                            runtimeDistribution: {"avg": {"field": "runtime"}} // Chart: Top 5 Slow Tasks
                        }
                    },
                    timeDistribution: {"auto_date_histogram": {"field": timeDistributionTSType, "buckets": 30,}}, // Chart: Time-Occurrences
                }
            },
            {
                size: 0,
                from_: 0
            }
        )
    }
}