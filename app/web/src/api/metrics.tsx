import {getTimeFilterQuery, search, summary, TimeFilters} from "./search";

export interface Metrics {
  getBasicMetrics(app_name: string, app_env: string, filters: TimeFilters): any;

  getMetadata(app_name: string): any;
}

export class MetricsService implements Metrics {
  getBasicMetrics(app_name, app_env, filters) {
    let query = [getTimeFilterQuery(filters)];
    if (app_env) query.push({ match: { app_env: app_env } });
    return search(
      app_name,
      {
        size: 0,
        query: {
          bool: {
            must: query.filter(Boolean),
          },
        },
        aggs: {
          seen_tasks: {
            terms: { field: "name", size: 1000 },
          },
          seen_workers: {
            terms: { field: "hostname", size: 1000 },
          },
          seen_states: {
            terms: { field: "state" },
          },
          seen_routing_keys: {
            terms: { field: "routing_key" },
          },
          seen_queues: {
            terms: { field: "queue", size: 1000 },
          },
          events: {
            terms: { field: "kind" },
            aggs: {
              processed: {sum: { field: "events_count" },}
            }
          }
        },
      },
      {
        size: 0,
        from_: 0,
      }
    );
  }

  aggregate(app_name, app_env, query, aggregations) {
    if (app_env) query.push({ match: { app_env: app_env } });
    return search(
      app_name,
      {
        size: 0,
        query: {
          bool: {
            must: query.filter(Boolean),
          },
        },
        aggs: aggregations,
      },
      {
        size: 0,
        from_: 0,
      }
    );
  }

  aggregate_summary(app_name, app_env, query, aggregations) {
    if (app_env) query.push({ match: { app_env: app_env } });
    return summary(
        app_name,
        {
          size: 0,
          query: {
            bool: {
              must: query.filter(Boolean),
            },
          },
          aggs: aggregations,
        },
        {
          size: 0,
          from_: 0,
        }
    );
  }

  getSeenTasks(app_name, app_env, filters: TimeFilters) {
    let query = [getTimeFilterQuery(filters)];
    return this.aggregate(app_name, app_env, query, {
      seen_tasks: {
        terms: { field: "name", size: 1000, missing: "N/A", min_doc_count: 0 },
      },
    });
  }

  filterSeenTasks(app_name, app_env, filters: TimeFilters, filter_value) {
    let query = [getTimeFilterQuery(filters)];
    query.push({ wildcard: { name: { value: filter_value+"*", case_insensitive: true } } });
    return this.aggregate(app_name, app_env, query, {
      seen_tasks: {
        terms: { field: "name", size: 1000, missing: "N/A", min_doc_count: 1 },
      },
    });
  }

  filterAggregation(app_name, app_env, filters: TimeFilters, filter_key, filter_value) {
    let query = [];
    if (filter_value && filter_value !== "")
      query.push({ wildcard: { [`${filter_key}.wc`]: { value: `*${filter_value}*`, case_insensitive: true } } });
    return this.aggregate_summary(app_name, app_env, query, {
      [filter_key]: {
        terms: {
          field: filter_key,
          size: 200,
          missing: "N/A",
          min_doc_count: 1,
          order: { last_seen_max: "desc" }
        },
        aggs: {
          last_seen_max: {
            max: { field: "last_seen" }
          }
        }
      }
    });
  }

  getSeenQueues(app_name, app_env, filters: TimeFilters) {
    let query = [getTimeFilterQuery(filters)];
    return this.aggregate(app_name, app_env, query, {
      seen_queues: {
        terms: { field: "queue", size: 100, missing: "N/A", min_doc_count: 0 },
      },
    });
  }

  getSeenRoutingKeys(app_name, app_env, filters: TimeFilters) {
    let query = [getTimeFilterQuery(filters)];
    return this.aggregate(app_name, app_env, query, {
      seen_routing_keys: {
        terms: { field: "routing_key", size: 100, missing: "N/A", min_doc_count: 0 },
      },
    });
  }

  getSeenExchanges(app_name, app_env, filters: TimeFilters) {
    let query = [getTimeFilterQuery(filters)];
    return this.aggregate(app_name, app_env, query, {
      seen_exchanges: {
        terms: { field: "exchange", size: 100, missing: "N/A", min_doc_count: 0 },
      },
    });
  }

  getSeenWorkers(app_name, app_env, filters: TimeFilters) {
    let query = [getTimeFilterQuery(filters)];
    query.push({ match: { kind: "worker" } });
    return this.aggregate(app_name, app_env, query, {
      seen_workers: {
        terms: { field: "hostname", size: 1000 },
      },
    });
  }

  getMetadata(app_name) {
    return summary(
      app_name,
      {
        size: 0,
        aggs: {
          seen_envs: {
            terms: { field: "app_env" },
          },
        },
      },
      {
        size: 0,
        from_: 0,
      }
    );
  }
}
