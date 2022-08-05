import { request } from "./request";
import { getFilterQuery, TaskFilters } from "./task";

export interface Backup {
  exportByQuery(
    app_name: string,
    app_env: string,
    filters: TaskFilters,
    dry_run: boolean
  ): any;
}

export class BackupService implements Backup {
  exportByQuery(
    app_name: string,
    app_env: string,
    filters: TaskFilters,
  ) {
    return request({
      method: "POST",
      path: `/v1/backup/export`,
      headers: {
        "x-leek-app-name": app_name,
        "x-leek-app-env": app_env,
      },
      body: {
        query: {
          bool: {
            must: getFilterQuery(app_env, filters),
          },
        },
      },
    });
  }
}
