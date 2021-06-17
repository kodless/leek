import React, {useState} from 'react';
import {Typography, Tabs, List, Row, Col, Tag, message, Space, Button, Modal, Spin} from 'antd';
import SyntaxHighlighter from 'react-syntax-highlighter';
import {atelierCaveDark} from 'react-syntax-highlighter/dist/esm/styles/hljs';

import {adaptTime} from '../../utils/date'
import TaskDetails from './TaskDetails.style'
import {buildTag} from "../../components/data/TaskData";
import {ControlService} from "../../api/control";
import {handleAPIError, handleAPIResponse} from "../../utils/errors";
import {useApplication} from "../../context/ApplicationProvider";
import {CheckCircleOutlined, ExclamationCircleOutlined, LoadingOutlined, SyncOutlined} from "@ant-design/icons";

const Text = Typography.Text;
const {TabPane} = Tabs;

const {confirm} = Modal;

export default props => {

    const {currentApp} = useApplication();
    const service = new ControlService();
    const [retrying, setRetrying] = useState<boolean>();


    function retry() {
        if (!currentApp) return;
        setRetrying(true);
        return service.retryTask(currentApp, props.task.uuid)
            .then(handleAPIResponse)
            .then((result: any) => {
                retriedSuccessfully(result.task_id)
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => setRetrying(false));
    }

    function handleRetryTask() {
        confirm({
            title: "Do you really want to retry this task?",
            icon: <ExclamationCircleOutlined/>,
            content: <>
                <Typography.Paragraph>Task retry is an experimental feature for now!</Typography.Paragraph>
                <Typography.Paragraph>Tasks part of chains, groups or chords will not be retried as part of them!</Typography.Paragraph>
            </>,
            onOk: () => {
                return retry()
            },
            okText: "Retry",
            cancelText: "Cancel",
        });
    }

    function retriedSuccessfully(task_id) {
        confirm({
            title: "Task retried!",
            icon: <CheckCircleOutlined style={{color: "#00BFA6"}}/>,
            content: <>
                <Typography.Paragraph>Task retried successfully with uuid <Typography.Text code>{task_id}</Typography.Text></Typography.Paragraph>
            </>,
            onOk: () => {
                window.open(`/task?app=${currentApp}&uuid=${task_id}`,"_self")
            },
            onCancel: () => {
                window.open(`/task?app=${currentApp}&uuid=${task_id}`, "_blank")
            },
            okText: "View",
            cancelText: "View in new tab",
        });
    }

    return (
        <TaskDetails>
            {/* Header */}

            <Row justify="space-between">
                <Col>{buildTag(props.task.state, props.task)} {adaptTime(props.task.timestamp)}</Col>
                <Col>
                    <Space>
                        { ["FAILED", "CRITICAL"].includes(props.task.state) &&
                            <Button onClick={handleRetryTask} loading={retrying} ghost type="primary">Retry</Button>
                        }
                        <Tag>{`${props.task.events_count} EVENTS`}</Tag>
                        <Text copyable={{text: window.location.href}} strong>LINK</Text>
                    </Space>
                </Col>
            </Row>

            <Tabs defaultActiveKey="basic"
                  tabBarExtraContent={
                      props.loading !== undefined && <Space>
                          <Typography.Text code> { props.loading ? <SyncOutlined spin />: <LoadingOutlined />} Refreshes every 5 seconds</Typography.Text>
                      </Space>
                  }
            >
                {/* Basic */}
                <TabPane tab="Basic" key="basic">
                    <List size="small">
                        <List.Item key="uuid">
                            <List.Item.Meta
                                title="UUID"
                                description={props.task.uuid}
                            />
                        </List.Item>
                        <List.Item key="name">
                            <List.Item.Meta
                                title="Name"
                                description={
                                    props.task.name ?
                                        props.task.name :
                                        <Text strong style={{color: "#d89614"}}>Task name not yet received</Text>
                                }
                            />
                        </List.Item>
                        <List.Item key="runtime">
                            <List.Item.Meta
                                title="Runtime"
                                description={props.task.runtime || "-"}
                            />
                        </List.Item>
                        <List.Item key="args">
                            <List.Item.Meta
                                title="Args"
                                description={props.task.args}
                            />
                        </List.Item>
                        <List.Item key="kwargs">
                            <List.Item.Meta
                                title="Keyword args"
                                description={props.task.kwargs || "-"}
                            />
                        </List.Item>
                        <List.Item key="result">
                            <List.Item.Meta
                                title="Result"
                                description={props.task.result || "-"}
                            />
                        </List.Item>
                    </List>
                </TabPane>
                {/* Log */}
                <TabPane tab="Log" key="log">
                    <List size="small">
                        <List.Item key="sent">
                            <List.Item.Meta
                                title="Queued"
                                description={adaptTime(props.task.queued_at)}
                            />
                        </List.Item>
                        <List.Item key="received">
                            <List.Item.Meta
                                title="Received"
                                description={adaptTime(props.task.received_at)}
                            />
                        </List.Item>
                        <List.Item key="started">
                            <List.Item.Meta
                                title="Started"
                                description={adaptTime(props.task.started_at)}
                            />
                        </List.Item>
                        <List.Item key="succeeded">
                            <List.Item.Meta
                                title="Succeeded"
                                description={adaptTime(props.task.succeeded_at)}
                            />
                        </List.Item>
                        <List.Item key="retried">
                            <List.Item.Meta
                                title="Retried"
                                description={adaptTime(props.task.retried_at)}
                            />
                        </List.Item>
                        <List.Item key="failed">
                            <List.Item.Meta
                                title="Failed"
                                description={adaptTime(props.task.failed_at)}
                            />
                        </List.Item>
                        <List.Item key="rejected">
                            <List.Item.Meta
                                title="Rejected"
                                description={adaptTime(props.task.rejected_at)}
                            />
                        </List.Item>
                        <List.Item key="revoked">
                            <List.Item.Meta
                                title="Revoked"
                                description={adaptTime(props.task.revoked_at)}
                            />
                        </List.Item>
                        <List.Item key="eta">
                            <List.Item.Meta
                                title="ETA"
                                description={adaptTime(props.task.eta)}
                            />
                        </List.Item>
                        <List.Item key="expires">
                            <List.Item.Meta
                                title="Expires"
                                description={adaptTime(props.task.expires)}
                            />
                        </List.Item>
                        <List.Item key="last_event">
                            <List.Item.Meta
                                title="Last Event"
                                description={adaptTime(props.task.timestamp)}
                            />
                        </List.Item>
                    </List>
                </TabPane>
                {/* Routing */}
                <TabPane tab="Routing" key="routing">
                    <List size="small">
                        <List.Item key="client">
                            <List.Item.Meta
                                title="Client"
                                description={props.task.client || "-"}
                            />
                        </List.Item>
                        <List.Item key="worker">
                            <List.Item.Meta
                                title="Worker"
                                description={
                                    props.task.worker ?
                                        <a href={`/workers/?hostname=${props.task.worker}`}>
                                            {props.task.worker}
                                        </a> : "-"
                                }
                            />
                        </List.Item>
                        <List.Item key="exchange">
                            <List.Item.Meta
                                title="Exchange"
                                description={props.task.exchange || "-"}
                            />
                        </List.Item>
                        <List.Item key="routing_key">
                            <List.Item.Meta
                                title="Routing Key"
                                description={props.task.routing_key || "-"}
                            />
                        </List.Item>
                        <List.Item key="queue">
                            <List.Item.Meta
                                title="Queue"
                                description={props.task.queue || "-"}
                            />
                        </List.Item>
                        <List.Item key="clock">
                            <List.Item.Meta
                                title="Clock"
                                description={props.task.clock}
                            />
                        </List.Item>
                    </List>
                </TabPane>
                {/* Relation */}
                <TabPane tab="Relation" key="relation">
                    <List size="small">
                        <List.Item key="root">
                            <List.Item.Meta
                                title="Root"
                                description={
                                    props.task.root_id ?
                                        <a target="_blank"
                                           href={`/task/?app=${currentApp}&uuid=${props.task.root_id}`}>
                                            {`<${props.task.root_id}>`}
                                        </a> : "SELF"
                                }
                            />
                        </List.Item>
                        <List.Item key="parent">
                            <List.Item.Meta
                                title="Parent"
                                description={
                                    props.task.parent_id ?
                                        <a target="_blank"
                                           href={`/task/?app=${currentApp}&uuid=${props.task.parent_id}`}>
                                            {`<${props.task.parent_id}>`}
                                        </a> : "-"
                                }
                            />
                        </List.Item>
                    </List>
                </TabPane>
                {/* Trace */}
                <TabPane tab="Trace" key="trace" disabled={!props.task.exception}>
                    <List size="small">
                        <List.Item key="retries">
                            <List.Item.Meta
                                title="Retries"
                                description={props.task.retries || "-"}
                            />
                        </List.Item>
                        <List.Item key="exception">
                            <List.Item.Meta
                                title="Exception"
                                description={props.task.exception}
                            />
                        </List.Item>
                        <List.Item key="traceback">
                            <List.Item.Meta
                                style={{width: "100%"}}
                                title="Traceback"
                                description={props.task.traceback &&
                                <SyntaxHighlighter style={atelierCaveDark}>
                                    {props.task.traceback}
                                </SyntaxHighlighter>
                                }
                            />
                        </List.Item>
                    </List>
                </TabPane>
                {/* Revocation */}
                <TabPane tab="Revocation" key="revocation" disabled={props.task.state !== "REVOKED"}>
                    <List size="small">
                        <List.Item key="expired">
                            <List.Item.Meta
                                title="Expired"
                                description={props.task.expired ? "Yes" : "No"}
                            />
                        </List.Item>
                        <List.Item key="terminated">
                            <List.Item.Meta
                                title="Terminated"
                                description={props.task.terminated ? "Yes" : "No"}
                            />
                        </List.Item>
                        <List.Item key="signum">
                            <List.Item.Meta
                                title="Signal Number"
                                description={props.task.signum || "-"}
                            />
                        </List.Item>
                    </List>
                </TabPane>
                {/* Revocation */}
                <TabPane tab="Rejection" key="rejection" disabled={props.task.state !== "REJECTED"}>
                    <List size="small">
                        <List.Item key="rejected">
                            <List.Item.Meta
                                title="Rejected"
                                description="Yes"
                            />
                        </List.Item>
                        <List.Item key="terminated">
                            <List.Item.Meta
                                title="Requeue"
                                description={props.task.requeue ? "Yes" : "No"}
                            />
                        </List.Item>
                    </List>
                </TabPane>
            </Tabs>
        </TaskDetails>
    );
};
