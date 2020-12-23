import React from "react";
import TimeAgo from 'react-timeago'
import {Typography, Tag} from "antd";

import {TaskState} from '../tags/TaskState'
import moment from "moment";

const Text = Typography.Text;

function TaskData() {
    return [
        {
            title: 'Last EV',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: timestamp => {
                return  <Text style={{color: "rgba(45,137,183,0.8)"}} strong>
                    {timestamp ? moment(timestamp).format("MMM D HH:mm:ss") : '-'} - <Text>
                    {timestamp ? <TimeAgo date={timestamp}/> : '-'}
                </Text>
                </Text>
            },
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: name => {
                return <Text strong style={{color: "rgb(52, 156, 80)"}}>{name}</Text>
            },
        },
        {
            title: 'UUID',
            dataIndex: 'uuid',
            key: 'uuid',
            render: uuid => {
                return <Tag><Text>{uuid}</Text></Tag>
            },
        },
        {
            title: 'State',
            dataIndex: 'state',
            key: 'state',
            render: (state, row) => {
                if (state === "SUCCEEDED" && row.retried_at)
                    return <TaskState state="RECOVERED" retries={row.retries}/>;
                else if (state === "REVOKED" && row.expired)
                    return <TaskState state={state} retries={row.retries} revocation_reason="E"/>;
                else if (state === "REVOKED" && row.terminated)
                    return <TaskState state={state} retries={row.retries} revocation_reason="T"/>;
                else
                    return <TaskState state={state} retries={row.retries}/>;
            },
        }
    ];
}


export default TaskData;