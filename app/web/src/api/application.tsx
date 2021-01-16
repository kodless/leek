import getFirebase from "../utils/firebase";
import env from "../utils/vars";
import {buildQueryString} from "./search";

export interface Application {
    listApplications(): any;

    listApplicationIndices(app_name: string): any;

    createApplication(application: { any }): any;

    purgeApplication(app_name: string): any;

    cleanApplication(app_name: string, kind: string, count: number, unit: string): any;

    deleteApplication(app_name: string): any;

    addFanoutTrigger(app_name: string, trigger: { any }): any

    editFanoutTrigger(app_name: string, trigger_id: string, trigger: { any }): any

    deleteFanoutTrigger(app_name: string, trigger_id: string): any
}

export class ApplicationService implements Application {
    listApplications() {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/applications`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                })
            );
        }
    }

    createApplication(application) {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/applications`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(application)
                })
            );
        }
    }

    purgeApplication(app_name) {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/applications/${app_name}/purge`,
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

    cleanApplication(app_name, kind, count, unit="minutes") {
        let fb = getFirebase();
        let params = {
            kind: kind,
            count: count,
            unit: unit
        };
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/applications/${app_name}/clean${buildQueryString(params)}`,
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

    deleteApplication(app_name) {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/applications/${app_name}`,
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

    addFanoutTrigger(app_name, trigger) {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/applications/${app_name}/fo-triggers`,
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                            "x-leek-app-name": app_name
                        },
                        body: JSON.stringify(trigger)
                    })
            );
        }
    }

    editFanoutTrigger(app_name, trigger_id, trigger) {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/applications/${app_name}/fo-triggers/${trigger_id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                            "x-leek-app-name": app_name
                        },
                        body: JSON.stringify(trigger)
                    })
            );
        }
    }

    deleteFanoutTrigger(app_name, trigger_id) {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/applications/${app_name}/fo-triggers/${trigger_id}`,
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

    listApplicationIndices(app_name) {
        let fb = getFirebase();
        if (fb) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(`${env.LEEK_API_URL}/v1/applications/${app_name}/indices`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                    })
            );
        }
    }
}
