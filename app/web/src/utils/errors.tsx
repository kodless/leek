import {message} from "antd";


export function handleAPIResponse(response) {
    if (response.ok) {
        return Promise.resolve(response.json());
    }
    return Promise.resolve(response.json()).then((responseInJson) => {
        return Promise.reject(responseInJson.error);
    });
}

export function handleAPIError(error) {
    if (error && error.message) {
        // Network error
        if (error.name == 'TypeError')
            message.error("Network error, maybe you are offline");
        // API Error
        else
            message.error(error.message);
    } else {
        console.log(error);
        message.error("Something went wrong")
    }
}
