import React from "react";
import {Typography, Tag} from "antd";

const Text = Typography.Text;

function IssueData() {
    return [
        {
            title: 'Exception',
            dataIndex: 'exception',
            key: 'exception',
            render: exception => {
                return <Text strong style={{color: "rgb(156,17,45)"}}>{exception}</Text>
            },
        },
        {
            title: 'Occurrence',
            dataIndex: 'doc_count',
            key: 'doc_count',
            render: doc_count => {
                return <Tag>{doc_count}</Tag>
            },
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
            title: 'Revoked',
            dataIndex: 'REVOKED',
            key: 'REVOKED',
            render: REVOKED => {
                return <Tag color="purple">{REVOKED}</Tag>
            }
        },
        {
            title: 'In Progress',
            dataIndex: 'QUEUED',
            key: 'QUEUED',
            render: (QUEUED, obj) => {
                return <Tag color="blue">{obj.QUEUED + obj.RECEIVED + obj.STARTED}</Tag>
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
            title: 'Recovered',
            dataIndex: 'RECOVERED',
            key: 'RECOVERED',
            render: RECOVERED => {
                return <Tag color="green">{RECOVERED}</Tag>
            }
        },
    ];
}


export default IssueData;