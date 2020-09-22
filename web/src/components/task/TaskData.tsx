import React from "react";
import TimeAgo from 'react-timeago'
import {Typography, Tag} from "antd";

import {TaskState} from './TaskState'

const Text = Typography.Text;

function TaskData() {
    return [
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
                return <Tag><Text copyable>{uuid}</Text></Tag>
            },
        },
        {
            title: 'State',
            dataIndex: 'state',
            key: 'state',
            render: state => {
                return <TaskState state={state}/>
            },
        },
        {
            title: 'Last EV',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: timestamp => {
                return (
                    <Text style={{color: "rgba(45,137,183,0.8)"}}>
                        {timestamp ? <TimeAgo date={timestamp * 1000}/> : '-'}
                    </Text>
                );
            }
        }
    ];
}


export default TaskData;