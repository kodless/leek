import getFirebase from "../utils/firebase";
import env from "../utils/vars";

export interface Agent {
    retrieveAgent(): any;

    startOrRestartAgent(): any;

    stopAgent(): any;

    stopAgent(): any;

    getSubscriptions(app_name: string): any

    addSubscription(app_name: string, subscription: any)

    deleteSubscription(app_name: string, subscription_name: string)
}

export class AgentService implements Agent {
    retrieveAgent() {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/agent/control`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                })
            );
        }
    }

    startOrRestartAgent() {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/agent/control`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({})
                })
            );
        }
    }

    stopAgent() {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/agent/control`,
                    {
                        method: "DELETE",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    })
            );
        }
    }

    getSubscriptions(app_name) {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/agent/subscriptions`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "x-leek-app-name": app_name
                    },
                })
            );
        }
    }

    addSubscription(app_name, subscription) {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/agent/subscriptions`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "x-leek-app-name": app_name
                    },
                    body: JSON.stringify(subscription)
                })
            );
        }
    }

    deleteSubscription(app_name, subscription_name) {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/agent/subscriptions/${subscription_name}`,
                    {
                        method: "DELETE",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                            "x-leek-app-name": app_name
                        },
                    })
            );
        }
    }
}
