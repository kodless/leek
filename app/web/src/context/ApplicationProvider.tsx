import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import { StringParam, useQueryParam } from "use-query-params";

import { ApplicationService } from "../api/application";
import { MetricsService } from "../api/metrics";
import CreateApp from "../containers/apps/CreateApp";
import { handleAPIError, handleAPIResponse } from "../utils/errors";

let metadataInterval;

interface ApplicationContextData {
  applications: {
    app_name: string;
    app_description: string;
    app_key: string;
    created_at: number;
    owner: string;
    fo_triggers: [any];
  }[];
  currentApp: string | undefined;
  currentEnv: string | undefined;
  seenEnvs: {
    key: string;
    doc_count: null;
  }[];

  listApplications();

  selectApplication(app_name: string | undefined);

  deleteApplication(app_name: string);

  selectEnv(name: string);

  updateApplication(app);
}

const initial = {
  applications: [],
  currentApp: undefined,
  currentEnv: undefined,
  seenEnvs: [],
};

// @ts-ignore
const ApplicationContext = React.createContext<ApplicationContextData>(
  initial as ApplicationContextData
);

function ApplicationProvider({ children }) {
  // Application
  const applicationService = new ApplicationService();
  const [loading, setLoading] = useState<boolean>(true);
  const [applications, setApplications] = useState<any[]>([]);
  // Query parameters
  const [currentApp, setCurrentApp] = useQueryParam("app", StringParam);
  const [currentEnv, setCurrentEnv] = useQueryParam("env", StringParam);

  // Metadata
  const metricsService = new MetricsService();
  const [seenEnvs, setSeenEnvs] = useState<ApplicationContextData["seenEnvs"]>(
    []
  );

  function listApplications() {
    setLoading(true);
    applicationService
      .listApplications()
      .then(handleAPIResponse)
      .then((apps: any) => {
        setApplications(apps);
        setLoading(false);
      }, handleAPIError)
      .catch(handleAPIError);
    // .finally(() => {
    //     setLoading(false);
    // });
  }

  function deleteApplication(app_name) {
    let newApps = applications.filter((app) => {
      return app.app_name !== app_name;
    });
    setApplications(newApps);
    if (currentApp === app_name)
      if (newApps.length !== 0) setCurrentApp(newApps[0].app_name);
      else setCurrentApp(undefined);
  }

  function updateApplication(app) {
    let appIndex = applications.findIndex(
      (obj) => obj.app_name == app.app_name
    );
    let newApplications = [...applications];
    newApplications[appIndex] = app;
    setApplications(newApplications);
  }

  function getMetadata() {
    if (!currentApp) return;
    metricsService
      .getMetadata(currentApp)
      .then(handleAPIResponse)
      .then((result: any) => {
        setSeenEnvs(result.aggregations.seen_envs.buckets);
      }, handleAPIError)
      .catch(handleAPIError);
  }

  function selectApplication(app_name) {
    setCurrentApp(app_name);
  }

  function selectEnv(appEnv) {
    setCurrentEnv(appEnv);
  }

  function select() {
    if (seenEnvs.length !== 0 && !currentEnv) {
      setCurrentEnv(seenEnvs[0].key);
    }
    if (applications.length !== 0 && !currentApp) {
      setCurrentApp(applications[0]["app_name"]);
    }
  }

  // App & Env change handler
  useEffect(() => {
    // Stop refreshing metadata
    if (metadataInterval) clearInterval(metadataInterval);

    // If no application specified, return
    if (!currentApp) {
      return;
    }

    // Else, get metadata every 10 seconds
    getMetadata();
    metadataInterval = setInterval(() => {
      getMetadata();
    }, 60000);
  }, [currentApp, currentEnv]);

  // Envs list change handler
  useEffect(() => {
    select();
  }, [seenEnvs, applications]);

  useEffect(() => {
    listApplications();
    return () => {
      clearInterval(metadataInterval);
    };
  }, []);

  function setCreateAppModalVisible(visible) {}

  return (
    <ApplicationContext.Provider
      value={{
        applications: applications,
        currentApp: currentApp,
        currentEnv: currentEnv,
        seenEnvs: seenEnvs,
        listApplications: listApplications,
        deleteApplication: deleteApplication,
        updateApplication: updateApplication,
        selectApplication: selectApplication,
        selectEnv: selectEnv,
      }}
    >
      {applications.length !== 0 && currentApp ? (
        children
      ) : loading ? (
        <Spin
          spinning={loading}
          size="large"
          style={{
            width: "100%",
            height: "100vh",
            lineHeight: "100vh",
          }}
        />
      ) : (
        <CreateApp
          createAppModalVisible={applications.length == 0}
          setCreateAppModalVisible={setCreateAppModalVisible}
        />
      )}
    </ApplicationContext.Provider>
  );
}

const useApplication = () => React.useContext(ApplicationContext);
export { ApplicationProvider, useApplication };
