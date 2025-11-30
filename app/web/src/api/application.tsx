import { buildQueryString, request } from "./request";

export interface Application {
  listApplications(): any;

  listApplicationIndices(app_name: string): any;

  createApplication(application: { any }): any;

  purgeApplication(app_name: string): any;

  cleanApplication(
    app_name: string,
    kind: string,
    count: number,
    unit: string
  ): any;

  deleteApplication(app_name: string): any;

  addFanoutTrigger(app_name: string, trigger: { any }): any;

  editFanoutTrigger(
    app_name: string,
    trigger_id: string,
    trigger: { any }
  ): any;

  deleteFanoutTrigger(app_name: string, trigger_id: string): any;


  grantApplicationAdmin(app_name: string, admin_email: string): any;

  revokeApplicationAdmin(app_name: string, admin_email: string): any;
}

export class ApplicationService implements Application {
  listApplications() {
    return request({
      method: "GET",
      path: "/v1/applications",
    });
  }

  createApplication(application) {
    return request({
      method: "POST",
      path: "/v1/applications",
      body: application,
    });
  }

  purgeApplication(app_name) {
    return request({
      method: "DELETE",
      path: `/v1/applications/purge`,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }

  cleanApplication(app_name, kind, count, unit = "minutes") {
    let params = {
      kind: kind,
      count: count,
      unit: unit,
    };
    return request({
      method: "DELETE",
      path: `/v1/applications/clean${buildQueryString(params)}`,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }

  deleteApplication(app_name) {
    return request({
      method: "DELETE",
      path: `/v1/applications`,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }

  addFanoutTrigger(app_name, trigger) {
    return request({
      method: "POST",
      path: `/v1/applications/fo-triggers`,
      body: trigger,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }

  editFanoutTrigger(app_name, trigger_id, trigger) {
    return request({
      method: "PUT",
      path: `/v1/applications/fo-triggers/${trigger_id}`,
      body: trigger,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }

  deleteFanoutTrigger(app_name, trigger_id) {
    return request({
      method: "DELETE",
      path: `/v1/applications/fo-triggers/${trigger_id}`,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }

  listApplicationIndices(app_name) {
    return request({
      method: "GET",
      path: `/v1/applications/indices`,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }

  listCleanupTasks(app_name) {
    return request({
      method: "GET",
      path: `/v1/applications/tasks/cleanup`,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }

  listTransforms(app_name) {
    return request({
      method: "GET",
      path: `/v1/applications/transforms`,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }

  startTransform(app_name) {
    return request({
      method: "POST",
      path: `/v1/applications/transforms/start`,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }

  grantApplicationAdmin(app_name, admin_email) {
    return request({
      method: "POST",
      path: `/v1/applications/admins/${admin_email}`,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }

  revokeApplicationAdmin(app_name, admin_email) {
    return request({
      method: "DELETE",
      path: `/v1/applications/admins/${admin_email}`,
      headers: {
        "x-leek-app-name": app_name,
      },
    });
  }
}
