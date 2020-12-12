import React from 'react';
import {Typography, Tabs, List, Row, Col} from 'antd';
import SyntaxHighlighter from 'react-syntax-highlighter';

import {adaptTime} from '../../utils/date'
import {TaskState} from '../../components/tags/TaskState'
import TaskDetailsDrawer from './TaskDetailsDrawer.style'

const Text = Typography.Text;
const {TabPane} = Tabs;


export default props => {
    return (
        <TaskDetailsDrawer>
            {/* Header */}

            <Row justify="space-between">
                <Col><TaskState state={props.task.state}/> {adaptTime(props.task.timestamp)}</Col>
                <Col><Text copyable={{text: window.location.href}} strong/> LINK </Col>
            </Row>

            <Tabs defaultActiveKey="basic">
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
                                description={props.task.name}
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
                                title="Sent"
                                description={adaptTime(props.task.sent_at)}
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
                                description={props.task.eta || "-"}
                            />
                        </List.Item>
                        <List.Item key="expires">
                            <List.Item.Meta
                                title="Expires"
                                description={props.task.expires || "-"}
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
                {/* Trace */}
                <TabPane tab="Trace" key="trace" disabled={!["FAILED", "RETRY", "REVOKED"].includes(props.task.state)}>
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
                                <SyntaxHighlighter>
                                    {props.task.traceback}
                                </SyntaxHighlighter>
                                }
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
                                    props.task.hostname ?
                                        <a href={`/workers/?hostname=${props.task.hostname}`}>
                                            {props.task.hostname}
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
                                           href={`/tasks/?uuid=${props.task.root_id}`}>
                                            {`${props.task.root_id} <${props.task.root_id}>`}
                                        </a> : "-"
                                }
                            />
                        </List.Item>
                        <List.Item key="parent">
                            <List.Item.Meta
                                title="Parent"
                                description={
                                    props.task.parent_id ?
                                        <a target="_blank"
                                           href={`/tasks/?uuid=${props.task.parent_id}`}>
                                            {`${props.task.parent_id} <${props.task.parent_id}>`}
                                        </a> : "-"
                                }
                            />
                        </List.Item>
                    </List>
                </TabPane>
            </Tabs>
        </TaskDetailsDrawer>
    );
};
