import {request} from "./request";

export interface Control {
    retryTask(
        app_name: string,
        task_uuid: string,
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
}
