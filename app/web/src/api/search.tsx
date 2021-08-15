import {buildQueryString, request} from "./request";

import moment from "moment";

export interface TimeFilters {
    timestamp_type: number | null,
    interval_type: string | null,
    after_time: number | null,
    before_time: number | null,
    offset: number | null,
}

export function getTimeFilterQuery(filters: TimeFilters) {
    let time_filter;
    if (filters.interval_type === "at" && filters.timestamp_type && (filters.after_time || filters.before_time)) {
        time_filter = {range: {[filters.timestamp_type]: {}}};
        if (filters.after_time) time_filter.range[filters.timestamp_type]["gte"] = filters.after_time;
        if (filters.before_time) time_filter.range[filters.timestamp_type]["lte"] = filters.before_time;
    } else if (filters.interval_type === "past" && filters.timestamp_type && filters.offset) {
        time_filter = {range: {[filters.timestamp_type]: {}}};
        time_filter.range[filters.timestamp_type]["gte"] = moment().valueOf() - filters.offset;
    }
    else if (filters.interval_type === "next" && filters.timestamp_type && filters.offset) {
        time_filter = {range: {[filters.timestamp_type]: {}}};
        time_filter.range[filters.timestamp_type]["lte"] = moment().valueOf() + filters.offset;
        time_filter.range[filters.timestamp_type]["gte"] = moment().valueOf();
    }
    return time_filter;
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
