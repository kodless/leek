import getFirebase from "../utils/firebase";
import env from "../utils/vars";


export function buildQueryString(obj: {}) {
    const keyValuePairs: string[] = [];
    for (const key in obj) {
        keyValuePairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`);
    }
    return `?${keyValuePairs.join('&')}`;
}

export function request(
    {
        method = "GET",
        path = "/",
        body = undefined,
        headers = {},
    }
) {
    // NO-AUTH
    if (env.LEEK_API_ENABLE_AUTH === "false") {
        return fetch(
            `${env.LEEK_API_URL}${path}`,
            {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    ...headers
                },
                body: body ? JSON.stringify(body) : undefined
            }
        )
    }
    // FIREBASE AUTH
    else {
        let fb = getFirebase();
        if (fb && fb.auth().currentUser) {
            return fb.auth().currentUser.getIdToken().then(token =>
                fetch(
                    `${env.LEEK_API_URL}${path}`,
                    {
                        method: method,
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                            ...headers
                        },
                        body: body ? JSON.stringify(body) : undefined
                    }
                )
            );
        } else return Promise.reject("unauthenticated")
    }
}
