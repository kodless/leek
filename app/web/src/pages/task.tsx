import React, {useState, useEffect} from "react";
import {Helmet} from 'react-helmet'
import {useQueryParam, StringParam} from "use-query-params";
import {Row, message} from 'antd'

import TaskDetailsDrawer from '../containers/tasks/TaskDetailsDrawer'

import {useApplication} from "../context/ApplicationProvider"
import {TaskService} from "../api/task"
import {handleAPIError, handleAPIResponse} from "../utils/errors"

let timeout;

const TaskPage: React.FC = () => {
    // STATE
    const service = new TaskService();
    const {currentApp} = useApplication();
    const [qpTaskUUID, setQPTaskUUID] = useQueryParam("uuid", StringParam);
    const [task, setTask] = useState({});

    // Data
    const [loading, setLoading] = useState<boolean>(false);

    // API Calls
    function getTaskByUUID(uuid: string) {
        if (!currentApp) return;
        setLoading(true);
        service.getById(currentApp, uuid)
            .then(handleAPIResponse)
            .then((result: any) => {
                if (result.hits.total == 0) {
                    message.warning("Task not found, maybe its very old");
                    return;
                }
                setTask(result.hits.hits[0]._source);
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        // Stop refreshing metadata
        if (timeout) clearInterval(timeout);
        if (qpTaskUUID) {
            getTaskByUUID(qpTaskUUID)
        }
        timeout = setInterval(() => {
            if (qpTaskUUID) {
                getTaskByUUID(qpTaskUUID);
            }
        }, 5000);

        return () => {
            clearInterval(timeout);
        }
    }, []);

    return (
        <>
            <Helmet
                title="Task detail"
                meta={[
                    {name: 'description', content: 'Task details'},
                    {name: 'keywords', content: 'celery, tasks'},
                ]}
            >
                <html lang="en"/>
            </Helmet>

            <Row style={{marginTop: "20px", width: "100%"}} gutter={[12, 12]}>
                <TaskDetailsDrawer task={task} loading={loading}/>
            </Row>
        </>
    )
};

export default TaskPage
