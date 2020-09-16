import {search} from "./search";


export interface Common {
    getSeenTasksAndWorkers(app_name: string): any;

}

export class CommonSearch implements Common {

    getSeenTasksAndWorkers(app_name) {
        return search(
            app_name,
            {
                "size": 0,
                "aggs": {
                    "seen_tasks": {
                        "terms": {"field": "name", "size": 500}
                    },
                    "seen_workers": {
                        "terms": {"field": "hostname", "size": 500}
                    },
                    "seen_states": {
                        "terms": {"field": "state", "size": 500}
                    },
                    "seen_envs": {
                        "terms": {"field": "app_env", "size": 500}
                    },
                    "seen_routing_keys": {
                        "terms": {"field": "routing_key", "size": 500}
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
