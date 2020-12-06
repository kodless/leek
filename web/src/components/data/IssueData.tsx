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
            render: name => {
                return <Text strong style={{color: "rgb(156,45,51)"}}>{name}</Text>
            },
        },
        {
            title: 'Occurrence',
            dataIndex: 'occurrence',
            key: 'occurrence',
            render: uuid => {
                return <Tag><Text copyable>{uuid}</Text></Tag>
            },
        },
        {
            title: 'Last seen',
            dataIndex: 'last_seen',
            key: 'last_seen',
            render: timestamp => {
                return (
                    <Text style={{color: "rgba(45,137,183,0.8)"}}>
                        {timestamp ? <TimeAgo date={timestamp}/> : '-'}
                    </Text>
                );
            }
        }
    ];
}


export default IssueData;