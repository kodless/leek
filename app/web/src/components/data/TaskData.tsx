import React from "react";
import TimeAgo from 'react-timeago'
import {Typography, Tag} from "antd";

import {TaskState} from '../tags/TaskState'
import moment from "moment";

const Text = Typography.Text;

export const buildTag = (state, task) => {
    if (state === "REVOKED" && task.expired)
        return <TaskState state={state} retries={task.retries} note="E"/>;
    else if (state === "REVOKED" && task.terminated)
        return <TaskState state={state} retries={task.retries} note="T"/>;
    else if (state === "REJECTED" && task.requeue)
        return <TaskState state={state} retries={task.retries} note="Q"/>;
    else if (state === "REJECTED" && !task.requeue)
        return <TaskState state={state} retries={task.retries} note="I"/>;
    else
        return <TaskState state={state} retries={task.retries}/>;
};

function TaskData() {
    return [
        {
            title: 'Last EV',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: timestamp => {
                return <Text style={{color: "rgba(45,137,183,0.8)"}} strong>
                    {timestamp ? moment(timestamp).format("MMM D HH:mm:ss Z") : '-'} - <Text>
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
                return name? <Text strong style={{color: "rgb(52, 156, 80)"}}>{name}</Text>: <Text strong style={{color: "#d89614"}}>Task name not yet received</Text>
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
            render: buildTag,
        }
    ];
}


export default TaskData;