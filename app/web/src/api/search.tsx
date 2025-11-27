import { buildQueryString, request } from "./request";

import moment from "moment";

export interface TimeFilters {
  timestamp_type: number | null;
  interval_type: string | null;
  from: number | null;
  to: number | null;
  offset: number | null;
}

export function getTimeFilterQuery(filters: TimeFilters) {
  let time_filter;
  if (
    filters.interval_type === "between" &&
    filters.timestamp_type &&
    (filters.from || filters.to)
  ) {
    time_filter = { range: { [filters.timestamp_type]: {} } };
    if (filters.from)
      time_filter.range[filters.timestamp_type]["gte"] = filters.from;
    if (filters.to)
      time_filter.range[filters.timestamp_type]["lte"] = filters.to;
  } else if (
    filters.interval_type === "past" &&
    filters.timestamp_type &&
    filters.offset
  ) {
    time_filter = { range: { [filters.timestamp_type]: {} } };
    time_filter.range[filters.timestamp_type]["gte"] = moment().valueOf() - filters.offset;
  }
  return time_filter;
}

export function search(app_name, query, params: {} = {}) {
  return request({
    method: "POST",
    path: `/v1/search${buildQueryString(params)}`,
    body: query,
    headers: {
      "x-leek-app-name": app_name,
    },
  });
}
