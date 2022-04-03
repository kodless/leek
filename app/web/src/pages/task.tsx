import React, {useState, useEffect} from "react";
import { Helmet } from 'react-helmet-async';
import {useQueryParam, StringParam} from "use-query-params";
import {Row, Empty, Typography} from 'antd'

import TaskDetails from '../containers/tasks/TaskDetails'

import {useApplication} from "../context/ApplicationProvider"
import {TaskService} from "../api/task"
import {handleAPIError, handleAPIResponse} from "../utils/errors"

let timeout;
const Title = Typography.Title;

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
                if (result.hits.hits.length > 0) {
                    setTask(result.hits.hits[0]._source);
                }
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
            <Helmet>
                <html lang="en"/>
                <title>Task detail</title>
                <meta name="description" content="Task details" />
                <meta name="keywords" content='celery, task' />
            </Helmet>

            <Row justify="center" style={{marginTop: "20px", width: "100%"}} gutter={[12, 12]}>

                {task && Object.keys(task).length > 0
                && <TaskDetails task={task} loading={loading}/>
                }

                {task && Object.keys(task).length === 0 &&
                    <Empty
                        description={
                            <Title level={3}>Waiting task...</Title>
                        }
                    />
                }

            </Row>
        </>
    )
};

export default TaskPage
