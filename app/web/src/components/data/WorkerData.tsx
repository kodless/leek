import React from "react";
import {Badge, Space, Typography} from "antd";
import {LoadingOutlined, CheckOutlined, HeartOutlined} from "@ant-design/icons";

import {WorkerState} from '../tags/WorkerState'

const Text = Typography.Text;

function WorkerData() {
    return [
        {
            title: 'Hostname',
            dataIndex: 'hostname',
            key: 'hostname',
            render: name => {
                return <Text strong style={{color: "rgb(52, 156, 80)"}}>{name}</Text>
            },
        },
        {
            title: 'Processed',
            dataIndex: 'processed',
            key: 'processed',
            render: processed => {
                return <Space direction="horizontal">
                    <CheckOutlined/>
                    <Badge count={processed} overflowCount={9999999} style={{backgroundColor: '#21ccaf'}} showZero/>
                </Space>
            },
        },
        {
            title: 'Active',
            dataIndex: 'active',
            key: 'active',
            render: active => {
                return <Space direction="horizontal">
                    <LoadingOutlined/>
                    <Badge count={active} overflowCount={9999999} style={{backgroundColor: '#adc6ff'}} showZero/>
                </Space>
            },
        },
        {
            title: 'State',
            dataIndex: 'state',
            key: 'state',
            render: state => {
                return <WorkerState state={state}/>
            },
        },
        {
            title: 'Load AVG',
            dataIndex: 'loadavg',
            key: 'loadavg',
            render: loadavgList => {
                return <Text strong style={{color: "rgb(52, 156, 80)"}}>{loadavgList.join('/')}</Text>
            },
        },
        {
            title: 'HB Freq',
            dataIndex: 'freq',
            key: 'freq',
            render: freq => {
                return (
                    <Space direction="horizontal">
                        <HeartOutlined/>
                        <Text style={{color: "rgba(45,137,183,0.8)"}}>
                            Every {freq} seconds
                        </Text>
                    </Space>
                );
            }
        },
    ];
}


export default WorkerData;