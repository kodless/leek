import {request} from "./request";

export interface Broker {
    getBrokerDrift(app_name: string, app_env: string): any;

    getBrokerQueues(app_name: string, app_env: string): any;
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

    getBrokerQueues(app_name: string, app_env: string) {
        return request({
            method: "GET",
            path: `/v1/broker/queues`,
            headers: {
                "x-leek-app-name": app_name,
                "x-leek-app-env": app_env,
            },
        });
    }
}
