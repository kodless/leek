import React from "react";
import {Typography, Tag} from "antd";

const Text = Typography.Text;

function QueueData() {
    return [
        {
            title: 'Queue',
            dataIndex: 'queue',
            key: 'queue',
            render: queue => {
                return <Text strong style={{color: "rgb(52, 156, 80)"}}>{queue}</Text>
            },
        },
        {
            title: 'Messages',
            dataIndex: 'doc_count',
            key: 'doc_count',
            render: doc_count => {
                return <Tag>{doc_count}</Tag>
            },
        },
        {
            title: 'Queued',
            dataIndex: 'QUEUED',
            key: 'QUEUED',
            render: QUEUED => {
                return <Tag color="blue">{QUEUED}</Tag>
            }
        },
        {
            title: 'Received',
            dataIndex: 'RECEIVED',
            key: 'RECEIVED',
            render: RECEIVED => {
                return <Tag color="blue">{RECEIVED}</Tag>
            }
        },
        {
            title: 'Started',
            dataIndex: 'STARTED',
            key: 'STARTED',
            render: STARTED => {
                return <Tag color="blue">{STARTED}</Tag>
            }
        },
        {
            title: 'Succeeded',
            dataIndex: 'SUCCEEDED',
            key: 'SUCCEEDED',
            render: SUCCEEDED => {
                return <Tag color="green">{SUCCEEDED}</Tag>
            }
        },
        {
            title: 'Recovered',
            dataIndex: 'RECOVERED',
            key: 'RECOVERED',
            render: RECOVERED => {
                return <Tag color="green">{RECOVERED}</Tag>
            }
        },
        {
            title: 'Retry',
            dataIndex: 'RETRY',
            key: 'RETRY',
            render: RETRY => {
                return <Tag color="orange">{RETRY}</Tag>
            }
        },
        {
            title: 'Failed',
            dataIndex: 'FAILED',
            key: 'FAILED',
            render: FAILED => {
                return <Tag color="red">{FAILED}</Tag>
            }
        },
        {
            title: 'Critical',
            dataIndex: 'CRITICAL',
            key: 'CRITICAL',
            render: CRITICAL => {
                return <Tag color="red">{CRITICAL}</Tag>
            }
        },
        {
            title: 'Revoked',
            dataIndex: 'REVOKED',
            key: 'REVOKED',
            render: REVOKED => {
                return <Tag color="purple">{REVOKED}</Tag>
            }
        },
    ];
}


export default QueueData;