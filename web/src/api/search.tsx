import getFirebase from "../utils/firebase";
import env from "../utils/vars";

function buildQueryString(obj: {}) {
    const keyValuePairs: string[] = [];
    for (const key in obj) {
        keyValuePairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`);
    }
    return `?${keyValuePairs.join('&')}`;
}

export function search(app_name, query, params: {} = {}) {
    let fb = getFirebase();
    if (fb && fb.auth().currentUser) {
        return fb.auth().currentUser.getIdToken().then(token =>
            fetch(
                `${env.LEEK_API_URL}/v1/search${buildQueryString(params)}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "x-leek-app-name": app_name
                    },
                    body: JSON.stringify(query)
                }
            )
        );
    } else return Promise.reject("unauthenticated")
}
