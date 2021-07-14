import {buildQueryString, request} from "./request";

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
