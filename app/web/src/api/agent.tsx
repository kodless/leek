import {request} from "./request";


export interface Agent {
    retrieveAgent(): any;

    startOrRestartAgent(): any;

    stopAgent(): any;

    getSubscriptions(app_name: string): any

    addSubscription(app_name: string, subscription: any)

    deleteSubscription(app_name: string, subscription_name: string)
}

export class AgentService implements Agent {
    retrieveAgent() {
        return request(
            {
                method: "GET",
                path: "/v1/agent/control",
            }
        )
    }

    startOrRestartAgent() {
        return request(
            {
                method: "POST",
                path: "/v1/agent/control",
            }
        )
    }

    stopAgent() {
        return request(
            {
                method: "DELETE",
                path: "/v1/agent/control",
            }
        )
    }

    getSubscriptions(app_name) {
        return request(
            {
                method: "GET",
                path: "/v1/agent/subscriptions",
                headers: {
                    "x-leek-app-name": app_name
                }
            }
        )
    }

    addSubscription(app_name, subscription) {
        return request(
            {
                method: "POST",
                path: "/v1/agent/subscriptions",
                body: subscription,
                headers: {
                    "x-leek-app-name": app_name
                }
            }
        )
    }

    deleteSubscription(app_name, subscription_name) {
        return request(
            {
                method: "DELETE",
                path: `/v1/agent/subscriptions/${subscription_name}`,
                headers: {
                    "x-leek-app-name": app_name
                }
            }
        )
    }
}
