import getFirebase from "../utils/firebase";
import env from "../utils/vars";
import {Task, TaskFilters} from "./task";

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
        let fb = getFirebase();
        if (fb && fb.auth().currentUser) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(
                    `${env.LEEK_API_URL}/v1/control/tasks/${task_uuid}/retry`,
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                            "x-leek-app-name": app_name
                        },
                        body: JSON.stringify({})
                    }
                )
            );
        } else return Promise.reject("unauthenticated")
    }
}
