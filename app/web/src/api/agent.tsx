import getFirebase from "../utils/firebase";
import env from "../utils/vars";

export interface Agent {
    retrieveAgent(): any;

    startOrRestartAgent(): any;

    stopAgent(): any;
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
}
