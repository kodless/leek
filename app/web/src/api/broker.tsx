import {buildQueryString, request} from "./request";

export interface Broker {
    getBrokerDrift(app_name: string, app_env: string): any;

    getBrokerQueues(app_name: string, app_env: string, hidePIDBoxes: boolean): any;

    purgeQueue(app_name: string, app_env: string, queue_name: string): any;
}

export class BrokerService implements Broker {
    getBrokerDrift(app_name: string, app_env: string) {
        return request({
            method: "GET",
            path: `/v1/broker/drift`,
            headers: {
                "x-leek-app-name": app_name,
                "x-leek-app-env": app_env,
            },
        });
    }

    getBrokerQueues(app_name: string, app_env: string, hidePIDBoxes: boolean) {
        return request({
            method: "GET",
            path: `/v1/broker/queues${buildQueryString({hide_pid_boxes: hidePIDBoxes})}`,
            headers: {
                "x-leek-app-name": app_name,
                "x-leek-app-env": app_env,
            },
        });
    }

    purgeQueue(app_name: string, app_env: string, queue_name: string) {
        return request({
            method: "DELETE",
            path: `/v1/broker/queue/${queue_name}/purge`,
            headers: {
                "x-leek-app-name": app_name,
                "x-leek-app-env": app_env,
            },
        });
    }

}
