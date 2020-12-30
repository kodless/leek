import React from "react";
import TimeAgo from 'react-timeago'
import {Typography, Tag} from "antd";

const Text = Typography.Text;

function IssueData() {
    return [
        {
            title: 'Exception',
            dataIndex: 'exception',
            key: 'exception',
            render: exception => {
                return <Text strong style={{color: "rgb(156,45,51)"}}>{exception}</Text>
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
            title: 'Failed',
            dataIndex: 'FAILED',
            key: 'FAILED',
            render: FAILED => {
                return <Tag color="red">{FAILED}</Tag>
            }
        },
        {
            title: 'Recovered',
            dataIndex: 'SUCCEEDED',
            key: 'SUCCEEDED',
            render: SUCCEEDED => {
                return <Tag color="green">{SUCCEEDED}</Tag>
            }
        },
    ];
}


export default IssueData;