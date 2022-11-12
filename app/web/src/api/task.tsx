import { getTimeFilterQuery, search } from "./search";
import {request, buildQueryString} from "./request";

export function getFilterQuery(
  app_env: string | undefined,
  filters: TaskFilters
) {
  let revocation_filter;
  if (filters.revocation_reason) {
    if (filters.revocation_reason === "terminated")
      revocation_filter = { match: { terminated: { query: true } } };
    else if (filters.revocation_reason === "expired")
      revocation_filter = { match: { expired: { query: true } } };
  }
  let rejection_filter;
  if (filters.rejection_outcome) {
    if (filters.rejection_outcome === "requeued")
      rejection_filter = { match: { requeue: { query: true } } };
    else if (filters.rejection_outcome === "ignored")
      rejection_filter = { match: { requeue: { query: false } } };
  }
  let f = [
    { match: { kind: "task" } },
    app_env && { match: { app_env: app_env } },
    filters.name && filters.name.length && { terms: { name: filters.name } },
    filters.uuid && { match: { uuid: filters.uuid } },
    filters.state &&
      filters.state.length && { terms: { state: filters.state } },
    filters.worker &&
      filters.worker.length && { terms: { worker: filters.worker } },
    filters.client && { term: { client: filters.client } },
    filters.routing_key &&
      filters.routing_key.length && {
        terms: { routing_key: filters.routing_key },
      },
    filters.queue &&
      filters.queue.length && { terms: { queue: filters.queue } },
    filters.parent && { match: { parent: filters.parent } },
    filters.runtime && {
      range: { runtime: { [filters.runtime_op || "gte"]: filters.runtime } },
    },
    filters.retries && {
      range: { retries: { [filters.retries_op || "gte"]: filters.retries } },
    },
    filters.exception && { match: { exception: { query: filters.exception } } },
    filters.traceback && {
      wildcard: {
        traceback: { value: filters.traceback, case_insensitive: true },
      },
    },
    filters.args && {
      wildcard: { args: { value: filters.args, case_insensitive: true } },
    },
    filters.kwargs && {
      wildcard: { kwargs: { value: filters.kwargs, case_insensitive: true } },
    },
    filters.result && {
      wildcard: { result: { value: filters.result, case_insensitive: true } },
    },
    filters.root_id && { match: { root_id: filters.root_id } },
    filters.parent_id && { match: { parent_id: filters.parent_id } },
    getTimeFilterQuery(filters),
    revocation_filter,
    rejection_filter,
  ];
  return f.filter(Boolean);
}

export interface TaskFilters {
  name: string[] | null;
  uuid: string | null;
  state: string[] | null;
  worker: string[] | null;
  client: string | null;
  routing_key: string[] | null;
  queue: string[] | null;
  parent: string | null;
  runtime: number | null;
  runtime_op: string | null;
  retries: number | null;
  retries_op: string | null;
  timestamp_type: number | null;
  interval_type: string | null;
  after_time: number | null;
  before_time: number | null;
  offset: number | null;
  exception: string | null;
  traceback: string | null;
  args: string | null;
  kwargs: string | null;
  result: string | null;
  root_id: string | null;
  parent_id: string | null;
  revocation_reason: string | null;
  rejection_outcome: string | null;
}

export interface Task {
  filter(
    app_name: string,
    app_env: string | undefined,
    size: number,
    from_: number,
    order: string | "desc",
    filters: TaskFilters
  ): any;

  getCeleryTree(
      app_name: string,
      app_env: string,
      root_id: string,
  )

  getById(app_name: string, uuid: string): any;
}

export class TaskService implements Task {
  filter(
    app_name: string,
    app_env: string | undefined,
    size: number,
    from_: number,
    order: string | "desc",
    filters: TaskFilters
  ) {
    return search(
      app_name,
      {
        query: {
          bool: {
            must: getFilterQuery(app_env, filters),
          },
        },
        sort: [{ timestamp: { order: order } }],
      },
      {
        size: size,
        from_: from_,
      }
    );
  }

  getById(app_name: string, uuid: string) {
    return search(
      app_name,
      {
        query: {
          term: {
            _id: uuid,
          },
        },
      },
      {
        size: 1,
        from_: 0,
      }
    );
  }

  getCeleryTree(
      app_name: string,
      app_env: string | undefined,
      root_id: string,
  ){
    return request({
      method: "GET",
      path: `/v1/search/workflow${buildQueryString({
        root_id: root_id,
      })}`,
      headers: {
        "x-leek-app-name": app_name,
        "x-leek-app-env": app_env,
      },
    });
  }
}
