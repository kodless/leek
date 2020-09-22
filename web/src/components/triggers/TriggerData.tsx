import React from "react";

import {Typography, Tag, Space, Button} from "antd";
import {DeleteOutlined, EditOutlined, SlackOutlined} from "@ant-design/icons";

import {TaskState} from '../task/taskState'

const Text = Typography.Text;

function TriggerData(props) {
    return [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: id => {
                return <Space direction="horizontal"><SlackOutlined/> <Text strong>{id}</Text></Space>
            },
        },
        {
            title: 'Status',
            dataIndex: 'enabled',
            key: 'ENABLED',
            render: enabled => {
                return (
                    enabled ? <Tag color="green">Enabled</Tag> : <Tag color="red">Disabled</Tag>
                )
            },
        },
        {
            title: 'States',
            dataIndex: 'states',
            key: 'states',
            render: states => {
                return (
                    states && states.length > 0 ? states.map((state, key) =>
                        <TaskState state={state} key={key}/>
                    ) : <Tag>{"All STATES"}</Tag>
                )
            },
        },
        {
            title: 'Environments',
            dataIndex: 'envs',
            key: 'envs',
            render: envs => {
                return (
                    envs && envs.length > 0 ? envs.map((env, key) =>
                        <Tag key={key}>{env}</Tag>
                    ) : <Tag>{"All ENVS"}</Tag>
                );
            }
        },
        {
            title: 'Actions',
            dataIndex: 'id',
            key: 'id',
            render: (id, record) => {
                return (
                    <Space direction="horizontal">
                        <Button
                            onClick={() => props.handleEditTrigger(id, record)}
                            size="small"
                            loading={props.triggersModifying}
                            icon={<EditOutlined/>}/>
                        <Button
                            onClick={() => props.handleDeleteTrigger(id)}
                            size="small"
                            type="primary"
                            ghost
                            danger
                            loading={props.triggersModifying}
                            icon={<DeleteOutlined/>}/>
                    </Space>
                )
            }
        }
    ];
}

export default TriggerData;