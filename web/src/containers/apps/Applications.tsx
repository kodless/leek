import React, {useEffect, useState} from 'react'
import {Row, Button, Col, Card, Typography, Space, PageHeader, Tag} from 'antd'

import {useApplication} from "../../context/ApplicationProvider";
import {adaptTime} from "../../utils/date";

import Triggers from "./Triggers";
import AppsList from "./AppsList"

const Text = Typography.Text;

const Applications = () => {

    const {applications, listApplications, currentApp} = useApplication();
    const [selectedApp, setSelectedApp] = useState<{
        app_name: string,
        app_description: string,
        api_key: string,
        created_at: number
        owner: string,
        broker: string,
        broker_version: string,
        fo_triggers: [any]
    } | undefined>(applications[0]);

    useEffect(() => {
        listApplications()
    }, []);

    function handleSelectApp(app) {
        setSelectedApp(app)
    }

    return (
        <Row justify="center">
            <Row style={{width: "100%"}}>
                <Col xxl={4} xl={4} md={6} lg={6} sm={24} xs={24}>
                    <AppsList onSelectApp={handleSelectApp} selectedApp={selectedApp}/>
                </Col>
                <Col xxl={20} xl={20} md={18} lg={18} sm={24} xs={24}>
                    {selectedApp &&
                    <PageHeader
                        onBack={() => setSelectedApp(undefined)}
                        title={selectedApp.app_name}
                        tags={
                            currentApp == selectedApp.app_name ? <Tag color="blue">Current</Tag>: <></>
                        }
                        subTitle={selectedApp.app_description}
                        extra={[
                            <Button key="1" type="primary" danger ghost>
                                Delete
                            </Button>,
                        ]}
                    >
                        <Card size="small" style={{marginBottom: "24px"}}>
                            <Row style={{marginBottom: "16px"}}>
                                <Space direction="horizontal">
                                    <Text strong>API KEY</Text>
                                    <Text copyable code>{selectedApp.api_key}</Text>
                                </Space>
                            </Row>

                            <Row style={{marginBottom: "16px"}}>
                                <Space direction="horizontal">
                                    <Text strong>Created</Text>
                                    <Text code>{adaptTime(selectedApp.created_at)}</Text>
                                </Space>
                            </Row>

                            <Row>
                                <Space direction="horizontal" style={{marginBottom: "16px"}}>
                                    <Text strong>Owner</Text>
                                    <Text code>{selectedApp.owner}</Text>
                                </Space>
                            </Row>

                            <Row>
                                <Space direction="horizontal">
                                    <Text strong>Broker</Text>
                                    <Text copyable code>{selectedApp.broker} ({selectedApp.broker_version})</Text>
                                </Space>
                            </Row>
                        </Card>

                        <Triggers selectedApp={selectedApp} setSelectedApp={setSelectedApp}/>
                    </PageHeader>
                    }
                </Col>
            </Row>
        </Row>
    )
};

export default Applications
