import React from 'react';
import {Typography, Tabs, List} from 'antd'

import {adaptTime} from '../../utils/date'
import {WorkerState} from '../../components/worker/workerState'

const Text = Typography.Text;
const {TabPane} = Tabs;

export default props => {
    return (
        <>
            {/* Header */}
            <WorkerState state={props.worker.state}/> {adaptTime(props.worker.timestamp)}
            <Text copyable={{text: window.location.href}} strong/>

            <Tabs defaultActiveKey="basic">
                <TabPane tab="Basic" key="basic">
                    <List size="small">
                        <List.Item key="hostname">
                            <List.Item.Meta
                                title="Hostname"
                                description={props.worker.hostname}
                            />
                        </List.Item>
                        <List.Item key="pid">
                            <List.Item.Meta
                                title="PID"
                                description={props.worker.pid}
                            />
                        </List.Item>
                        <List.Item key="processed">
                            <List.Item.Meta
                                title="Processed"
                                description={
                                    props.worker.processed === 0 ? '-' : props.worker.processed
                                }
                            />
                        </List.Item>
                    </List>
                </TabPane>
                <TabPane tab="Heartbeat" key="hb">
                    <List size="small">
                        <List.Item key="freq">
                            <List.Item.Meta
                                title="HB Frequency"
                                description={`Every ${props.worker.freq} seconds`}
                            />
                        </List.Item>
                        <List.Item key="loadavgList">
                            <List.Item.Meta
                                title="Load Averages"
                                description={
                                    <ul>
                                        <li><Text><b>1m:</b> {props.worker["loadavg"][0]}</Text></li>
                                        <li><Text><b>5m:</b> {props.worker["loadavg"][1]}</Text></li>
                                        <li><Text><b>15m:</b> {props.worker["loadavg"][2]}</Text></li>
                                    </ul>
                                }
                            />
                        </List.Item>
                        <List.Item key="online_at">
                            <List.Item.Meta
                                title="Online at"
                                description={adaptTime(props.worker.online_at)}
                            />
                        </List.Item>
                        <List.Item key="timestamp">
                            <List.Item.Meta
                                title="Last HB"
                                description={adaptTime(props.worker.timestamp)}
                            />
                        </List.Item>
                    </List>
                </TabPane>
                <TabPane tab="Software" key="Software">
                    <List size="small">
                        <List.Item key="sw_sys">
                            <List.Item.Meta
                                title="Operating system"
                                description={props.worker.sw_sys}
                            />
                        </List.Item>
                        <List.Item key="sw_ident">
                            <List.Item.Meta
                                title="Worker software"
                                description={props.worker.sw_ident}
                            />
                        </List.Item>
                        <List.Item key="Software version">
                            <List.Item.Meta
                                title="Processed"
                                description={props.worker.sw_ver}
                            />
                        </List.Item>
                    </List>
                </TabPane>
            </Tabs>
        </>
    );
};
