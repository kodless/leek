import React, {useEffect, useState} from 'react'
import {Row, Button, Col, Card, Typography, Space, PageHeader, Tag, message, Modal} from 'antd'
import {ExclamationCircleOutlined} from '@ant-design/icons';

import Triggers from "./Triggers";
import AppsList from "./AppsList"

import {useApplication} from "../../context/ApplicationProvider";
import {adaptTime} from "../../utils/date";
import {ApplicationSearch} from "../../api/application";
import {handleAPIError, handleAPIResponse} from "../../utils/errors";

const Text = Typography.Text;
const {confirm} = Modal;

const Applications = () => {

    const applicationSearch = new ApplicationSearch();
    const [applicationPurging, setApplicationPurging] = useState<boolean>();
    const [applicationDeleting, setApplicationDeleting] = useState<boolean>();
    const {applications, currentApp, listApplications, deleteApplication} = useApplication();
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

    function handlePurgeApp() {
        if (selectedApp) {
            confirm({
                title: 'Purge application',
                icon: <ExclamationCircleOutlined/>,
                content: 'Do you want to purge all events from selected application?',
                onOk() {
                    setApplicationPurging(true);
                    applicationSearch.purgeApplication(selectedApp.app_name)
                        .then(handleAPIResponse)
                        .then((_: any) => {
                            message.info("Application purged!")
                        }, handleAPIError)
                        .catch(handleAPIError)
                        .finally(() => {
                            setApplicationPurging(false);
                        });
                }
            });
        }
    }

    function handleDeleteApp() {
        if (selectedApp) {
            confirm({
                title: 'Delete application',
                icon: <ExclamationCircleOutlined/>,
                content: 'Do you want to delete selected application?',
                onOk() {
                    setApplicationDeleting(true);
                    applicationSearch.deleteApplication(selectedApp.app_name)
                        .then(handleAPIResponse)
                        .then((_: any) => {
                            deleteApplication(selectedApp.app_name);
                            setSelectedApp(undefined);
                            message.info("Application deleted!")
                        }, handleAPIError)
                        .catch(handleAPIError)
                        .finally(() => {
                            setApplicationDeleting(false);
                        });
                }
            });
        }
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
                            <Button key="1" type="dashed" danger ghost onClick={handlePurgeApp}
                                    loading={applicationPurging}>
                                Purge
                            </Button>,
                            <Button key="2" danger ghost onClick={handleDeleteApp}
                                    loading={applicationDeleting}>
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
