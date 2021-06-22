import {request} from "./request";

export function buildQueryString(obj: {}) {
    const keyValuePairs: string[] = [];
    for (const key in obj) {
        keyValuePairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`);
    }
    return `?${keyValuePairs.join('&')}`;
}

export function search(app_name, query, params: {} = {}) {
    return request(
        {
            method: "POST",
            path: `/v1/search${buildQueryString(params)}`,
            body: query,
            headers: {
                "x-leek-app-name": app_name,
            },
        }
    )
}
