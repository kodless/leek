import React, {useState, useEffect} from 'react'
import {Button, message, Spin} from 'antd';
import {StringParam, useQueryParam} from "use-query-params";

import {ApplicationSearch} from "../api/application";
import {CommonSearch} from "../api/common";
import CreateApp from "../containers/apps/CreateApp";
import {handleAPIError, handleAPIResponse} from "../utils/errors";

let interval;

interface ApplicationContextData {
    applications: {
        app_name: string,
        app_description: string,
        api_key: string,
        created_at: number
        owner: string,
        broker: string,
        broker_version: string,
        fo_triggers: [any]
    }[];
    currentApp: string | undefined;
    currentEnv: string | undefined;

    seenWorkers: {
        key: string;
        doc_count: null;
    }[];
    seenTasks: {
        key: string;
        doc_count: null;
    }[];
    seenStates: {
        key: string;
        doc_count: null;
    }[];
    seenRoutingKeys: {
        key: string;
        doc_count: null;
    }[];
    seenEnvs: {
        key: string;
        doc_count: null;
    }[];

    listApplications();

    selectApplication(app_name: string);

    deleteApplication(app_name: string);

    selectEnv(name: string);
}

const initial = {
    applications: [],
    currentApp: undefined,
    currentEnv: undefined,
    seenWorkers: [],
    seenTasks: [],
    seenStates: [],
    seenRoutingKeys: [],
    seenEnvs: []
};

// @ts-ignore
const ApplicationContext = React.createContext<ApplicationContextData>(initial as ApplicationContextData);

function ApplicationProvider({children}) {
    // Application
    const applicationSearch = new ApplicationSearch();
    const [qpApp, setQPApp] = useQueryParam("app", StringParam);
    const [loading, setLoading] = useState<boolean>(true);
    const [applications, setApplications] = useState<any[]>([]);
    const [currentApp, setCurrentApp] = useState<string | undefined>(undefined);
    const [currentEnv, setCurrentEnv] = useState<string | undefined>(undefined);

    // Metadata
    const commonSearch = new CommonSearch();
    const [seenWorkers, setSeenWorkers] = useState<ApplicationContextData["seenWorkers"]>([]);
    const [seenTasks, setSeenTasks] = useState<ApplicationContextData["seenTasks"]>([]);
    const [seenStates, setSeenStats] = useState<ApplicationContextData["seenStates"]>([]);
    const [seenRoutingKeys, setSeenRoutingKeys] = useState<ApplicationContextData["seenRoutingKeys"]>([]);
    const [seenEnvs, setSeenEnvs] = useState<ApplicationContextData["seenEnvs"]>([]);

    function listApplications() {
        setLoading(true);
        applicationSearch.listApplications()
            .then(response => response.json())
            .then((apps: any) => {
                setApplications(apps);
                if (apps.length !== 0 && !currentApp)
                    setCurrentApp(apps[0]["app_name"]);
                setLoading(false);
            })
            .catch((error) => {
                console.log(error);
                message.error(<>{"Unable to connect to backend, retry after 10 seconds"} <Button>Retry now</Button></>, 10);
                setTimeout(listApplications, 10000)
            });
    }

    function getMetadata() {
        if (!currentApp) return;
        commonSearch.getSeenTasksAndWorkers(currentApp)
            .then(handleAPIResponse)
            .then((result: any) => {
                setSeenWorkers(result.aggregations.seen_workers.buckets);
                setSeenTasks(result.aggregations.seen_tasks.buckets);
                setSeenStats(result.aggregations.seen_states.buckets);
                setSeenRoutingKeys(result.aggregations.seen_routing_keys.buckets);
                setSeenEnvs(result.aggregations.seen_envs.buckets)
            }, handleAPIError)
            .catch(handleAPIError);
    }

    function selectApplication(app_name) {
        setQPApp(app_name);
        setCurrentApp(app_name);
    }

    function selectEnv(appEnv) {
        setCurrentEnv(appEnv);
    }

    useEffect(() => {
        listApplications();
        return () => { clearInterval(interval); }
    }, []);


    useEffect(() => {
        if (interval) clearInterval(interval);
        // If no application specified, return
        if (!currentApp)
            return;
        // Else, get metadata every 10 seconds
        getMetadata();
        interval =  setInterval(() => {
            getMetadata();
        }, 10000);
    }, [currentApp]);

    function deleteApplication(app_name) {
        let newApps = applications.filter( app => {
            return app.app_name !== app_name;
        });
        setApplications(newApps);
        if (currentApp === app_name)
            if (newApps.length !== 0)
                setCurrentApp(newApps[0].app_name);
            else
                setCurrentApp(undefined);
    }

    function setCreateAppModalVisible(visible) {

    }

    return (
        <ApplicationContext.Provider value={
            {
                applications: applications,
                currentApp: currentApp,
                currentEnv: currentEnv,
                seenWorkers: seenWorkers,
                seenTasks: seenTasks,
                seenStates: seenStates,
                seenRoutingKeys: seenRoutingKeys,
                seenEnvs: seenEnvs,
                listApplications: listApplications,
                deleteApplication: deleteApplication,
                selectApplication: selectApplication,
                selectEnv: selectEnv
            }
        }>
            {
                applications.length !== 0 && currentApp ? children : loading ?
                    <Spin spinning={loading} size="large" style={{
                        width: "100%",
                        height: "100vh",
                        lineHeight: "100vh"
                    }}/> : <CreateApp createAppModalVisible={applications.length == 0} setCreateAppModalVisible={setCreateAppModalVisible} />
            }
        </ApplicationContext.Provider>
    )
}

const useApplication = () => React.useContext(ApplicationContext);
export {ApplicationProvider, useApplication}
