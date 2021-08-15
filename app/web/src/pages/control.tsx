import React, {useMemo, useState} from 'react'
import {Helmet} from 'react-helmet'
import {Steps, Row, Button, Card, Select, Typography, Checkbox, Modal, Divider} from 'antd';
import {CheckCircleOutlined} from "@ant-design/icons";

import {useApplication} from "../context/ApplicationProvider";
import {ControlService} from "../api/control";
import {handleAPIError, handleAPIResponse} from "../utils/errors";
import {badgedOption} from "../components/tags/BadgedOption";
import {TaskState} from "../components/tags/TaskState";
import {MetricsService} from "../api/metrics";

const {Step} = Steps;
const Option = Select.Option;
const {confirm} = Modal;


const ControlPage = () => {

    const [current, setCurrent] = useState(0);
    const [command, setCommand] = useState<string>("revoke");
    const {currentApp, currentEnv} = useApplication();

    const service = new ControlService();
    const metricsService = new MetricsService();
    const [broadcasting, setBroadcasting] = useState<boolean>();

    const [seenTasks, setSeenTasks] = useState([]);
    const [taskName, setTaskName] = useState<string>();
    const [terminate, setTerminate] = useState<boolean>(false);
    const [signal, setSignal] = useState<string>("SIGTERM");
    const [revocationCount, setRevocationCount] = useState<number>(0);


    const next = () => {
        if (command === "revoke" && current === 1)
            revoke("true").then(() => {
                setCurrent(current + 1);
            })
        else
            setCurrent(current + 1);
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    const memoizedTaskNameOptions = useMemo(() => {
        // memoize this because it's common to have many different task names, which causes the dropdown to be very laggy.
        // This is a known problem in Ant Design
        return seenTasks.map((task, key) => badgedOption(task))
    }, [seenTasks])


    function revoke(dry_run) {
        if (!currentApp || !currentEnv || !taskName) return;
        setBroadcasting(true);
        return service.revokeTasksByName(currentApp, currentEnv, taskName, terminate, signal, dry_run)
            .then(handleAPIResponse)
            .then((result: any) => {
                setRevocationCount(result.revocation_count);
                if (dry_run !== "true") {
                    setCurrent(0)
                    pendingRevocation(result)
                }
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => setBroadcasting(false));
    }

    function broadcastCommand() {
        if (command === "revoke")
            revoke("false")
    }

    function pendingRevocation(result) {
        confirm({
            title: "Tasks pending revocation!",
            icon: <CheckCircleOutlined style={{color: "#00BFA6"}}/>,
            content: <>
                <Typography.Paragraph>Revocation command queued
                    for {result.revocation_count} tasks!</Typography.Paragraph>
            </>,
            okText: "Ok",
            cancelButtonProps: {style: {display: 'none'}}
        });
    }

    function getSeenTasks(open) {
        if (!currentApp || !open) return;
        metricsService.getSeenTasks(currentApp, currentEnv)
            .then(handleAPIResponse)
            .then((result: any) => {
                setSeenTasks(result.aggregations.seen_tasks.buckets);
            }, handleAPIError)
            .catch(handleAPIError);
    }

    return (
        <>
            <Helmet
                title="Control"
                meta={[
                    {name: 'description', content: 'Control commands'},
                    {name: 'keywords', content: 'celery, tasks'},
                ]}
            >
                <html lang="en"/>
            </Helmet>

            {/* Steps */}
            <Row style={{marginTop: 20}}>
                <Card style={{width: "100%"}}>
                    <Steps current={current}>
                        <Step title="Command" description="Choose command"/>
                        <Step title="Setup" description="Setup command args"/>
                        <Step title="Broadcast" description="Broadcast command"/>
                    </Steps>
                </Card>
            </Row>

            {/* Tabs Containers */}
            <Row style={{marginTop: 20, marginBottom: 20}}>
                <Card style={{width: "100%", alignItems: "center"}}>
                    {current == 0 && (
                        <Row justify="center" style={{width: "100%"}}>
                            <Row style={{width: "100%"}} justify="center">
                                <Typography.Title level={5}>
                                    What control command you want to broadcast?
                                </Typography.Title>
                            </Row>

                            <Row style={{width: "100%"}} justify="center">
                                <Select style={{width: "200"}} defaultValue="revoke"
                                        onSelect={value => setCommand(value)}>
                                    <Option value="revoke">Revoke</Option>
                                </Select>
                            </Row>
                        </Row>
                    )}

                    {current == 1 && command === "revoke" && (
                        <Row justify="center" style={{width: "100%"}}>

                            <Typography.Paragraph>
                                Revoking tasks works by sending a broadcast message to all the workers, the workers then
                                keep a list of revoked tasks in memory. When a worker receives a task in the list, it
                                will skip executing the task.
                            </Typography.Paragraph>

                            <Select placeholder="Task name"
                                    style={{width: "100%"}}
                                    allowClear
                                    showSearch
                                    dropdownMatchSelectWidth={false}
                                    onDropdownVisibleChange={getSeenTasks}
                                    // @ts-ignore
                                    onSelect={value => setTaskName(value)}
                            >
                                {memoizedTaskNameOptions}
                            </Select>

                            <Row align="middle" style={{marginTop: 16, width: "100%"}}>
                                <Checkbox onChange={e => setTerminate(e.target.checked)}> Terminate already started
                                    tasks with</Checkbox>
                                <Select style={{width: 90}}
                                    // @ts-ignore
                                        onSelect={value => setSignal(value)}
                                        defaultValue="SIGTERM"
                                >
                                    <Option value="SIGTERM">SIGTERM</Option>
                                    <Option value="SIGKILL">SIGKILL</Option>
                                </Select>
                            </Row>

                            <Row justify="start" style={{width: "100%", marginTop: 10}}>
                                <Typography.Paragraph type="secondary">
                                    The worker won’t terminate an already executing task unless the terminate option
                                    is set.
                                </Typography.Paragraph>
                            </Row>

                            <Divider/>

                            <Row justify="start" style={{width: "100%"}}>
                                <Typography.Text type="secondary">
                                    <Typography.Text strong type="warning">Caveats:</Typography.Text>
                                    <ul>
                                        <li>
                                            When a worker starts up it will synchronize revoked tasks with other workers
                                            in the cluster unless you have disabled synchronization using worker arg
                                            <Typography.Text code>--without-mingle</Typography.Text>.
                                        </li>
                                        <li>
                                            If The list of revoked tasks is in-memory and if all workers restart the
                                            list of revoked ids will also vanish. If you want to preserve this list
                                            between restarts you need to specify a file for these to be stored in by
                                            using the <Typography.Text code>–statedb</Typography.Text> argument to
                                            celery worker.
                                        </li>
                                    </ul>
                                </Typography.Text>
                            </Row>
                        </Row>
                    )}

                    {current == 2 && command === "revoke" && (
                        <>
                            <Row justify="center" style={{width: "100%"}}>
                                <Typography.Paragraph>
                                    Found <Typography.Text code>{revocationCount}</Typography.Text> pending ( <TaskState
                                    state="QUEUED"/> <TaskState state="RECEIVED"/> <TaskState state="STARTED"/>)
                                    instances of
                                    task <Typography.Text code>{taskName}</Typography.Text>.
                                    Are you sure you want to revoke them all?
                                </Typography.Paragraph>
                            </Row>
                            {terminate &&
                            <Row justify="center" style={{width: "100%"}}>
                                <Typography.Paragraph type="secondary">
                                    If an instance is already <TaskState state="STARTED"/> it will be terminated
                                    using <Typography.Text
                                    code>{signal}</Typography.Text> signal!
                                </Typography.Paragraph>
                            </Row>
                            }
                        </>

                    )}
                </Card>
            </Row>

            {/* Controls */}
            <Row justify="end">
                {current > 0 && (
                    <Button style={{margin: '0 8px'}} onClick={() => prev()}>
                        Previous
                    </Button>
                )}
                {current < 2 && (
                    <Button type="primary" onClick={() => next()}>
                        Next
                    </Button>
                )}
                {current === 2 && (
                    <Button type="primary" onClick={broadcastCommand} loading={broadcasting}>
                        Broadcast
                    </Button>
                )}
            </Row>
        </>
    )
};

export default ControlPage
