import {buildQueryString, request} from "./request";
import {getFilterQuery, TaskFilters} from "./task";

export interface Control {
    retryTask(
        app_name: string,
        task_uuid: string,
    ): any;
    revokeTaskByID(
        app_name: string,
        task_uuid: string,
        terminate: boolean,
        signal: string
    ): any;
    revokeTasksByName(
        app_name: string,
        app_env: string,
        task_name: string,
        terminate: boolean,
        signal: string,
        dry_run: string,
    ): any;
    retryTasksByQuery(
        app_name: string,
        app_env: string,
        filters: TaskFilters,
        dry_run: boolean
    ): any;
}

export class ControlService implements Control {
    retryTask(
        app_name: string,
        task_uuid: string,
    ) {
        return request(
            {
                method: "POST",
                path: `/v1/control/tasks/${task_uuid}/retry`,
                headers: {
                    "x-leek-app-name": app_name
                }
            }
        )
    }
    revokeTaskByID(
        app_name: string,
        task_uuid: string,
        terminate: boolean,
        signal: string
    ) {
        return request(
            {
                method: "POST",
                path: `/v1/control/tasks/${task_uuid}/revoke-by-id`,
                headers: {
                    "x-leek-app-name": app_name
                },
                // @ts-ignore
                body: {
                    "terminate": terminate,
                    "signal": signal
                }
            }
        )
    }
    revokeTasksByName(
        app_name: string,
        app_env: string,
        task_name: string,
        terminate: boolean,
        signal: string,
        dry_run: string,
    ) {
        return request(
            {
                method: "POST",
                path: `/v1/control/tasks/${task_name}/revoke-by-name${buildQueryString({"dry_run": dry_run})}`,
                headers: {
                    "x-leek-app-name": app_name,
                    "x-leek-app-env": app_env
                },
                // @ts-ignore
                body: {
                    "terminate": terminate,
                    "signal": signal
                }
            }
        )
    }
    retryTasksByQuery(
        app_name: string,
        app_env: string,
        filters: TaskFilters,
        dry_run: boolean
    ) {
        return request(
            {
                method: "POST",
                path: `/v1/control/tasks/retry-by-query`,
                headers: {
                    "x-leek-app-name": app_name,
                    "x-leek-app-env": app_env
                },
                body: {
                    query: {
                        query: {
                            "bool": {
                                "must": getFilterQuery(app_env, filters)
                            }
                        },
                    },
                    dry_run: dry_run
                },
            }
        )
    }
}
