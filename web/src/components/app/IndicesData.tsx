import React from "react";

import {Typography, Tag, Space} from "antd";

const Text = Typography.Text;

function IndicesData() {
    return [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: name => {
                return <Space direction="horizontal"><Text strong>{name}</Text></Space>
            },
        },
        {
            title: 'Shards',
            dataIndex: 'shards',
            key: 'shards',
            render: shards => {
                return (
                    <Tag color="green">{shards}</Tag>
                )
            },
        },
        {
            title: 'Replicas',
            dataIndex: 'replicas',
            key: 'replicas',
            render: replicas => {
                return (
                    <Tag color="green">{replicas}</Tag>
                )
            },
        },
    ];
}

export default IndicesData;