import React, {useEffect, useState} from 'react'
import {
    Row,
    Button,
    Col,
    Card,
    Typography,
    Space,
    PageHeader,
    Tag,
    message,
    Modal,
    Divider,
    Input,
    InputNumber, Select, Form
} from 'antd'
import {ExclamationCircleOutlined} from '@ant-design/icons';
import SyntaxHighlighter from 'react-syntax-highlighter';
import {atelierCaveDark} from 'react-syntax-highlighter/dist/esm/styles/hljs';

import Triggers from "./Triggers";
import AppsList from "./AppsList"

import {useApplication} from "../../context/ApplicationProvider";
import {adaptTime} from "../../utils/date";
import {ApplicationService} from "../../api/application";
import {handleAPIError, handleAPIResponse} from "../../utils/errors";
import Indices from "./Indices";
import getFirebase from "../../utils/firebase";

const Text = Typography.Text;
const {confirm} = Modal;
const Option = Select.Option;
const FormItem = Form.Item;

const inferOrgName = () => {
    let fb = getFirebase();
    if (fb && fb.auth().currentUser) {
        let owner_email = fb.auth().currentUser.email;
        let parts = owner_email.split('@');
        if (parts[1] === "gmail.com")
            return parts[0];
        else
            return parts[1];
    }
    return "mono"
};

const agentSubscriptionsSnippet = (app) => {
    return `
    [
        {
            "broker": "amqp://admin:admin@mq//",
            "backend": null,
            "exchange": "celeryev",
            "queue": "leek.fanout",
            "routing_key": "#",
            "org_name": "${inferOrgName()}",
            "app_name": "${app.app_name}",
            "app_env": "prod",
            "app_key": "${app.app_key}",
            "api_url": "http://0.0.0.0:5000"
        }
    ]
    `
};

const Applications = () => {

    const service = new ApplicationService();
    const [applicationPurging, setApplicationPurging] = useState<boolean>();
    const [applicationDeleting, setApplicationDeleting] = useState<boolean>();
    const {applications, currentApp, listApplications, deleteApplication} = useApplication();
    const [selectedApp, setSelectedApp] = useState<{
        app_name: string,
        app_description: string,
        app_key: string,
        created_at: number
        owner: string,
        fo_triggers: [any]
    } | undefined>();

    const [isCleanModalVisible, setIsCleanModalVisible] = useState(false);

    useEffect(() => {
        listApplications();
    }, []);

    useEffect(() => {
        // Initialise selected app when the apps are fetched and the selectedApp is null
        if (applications.length && !selectedApp)
            setSelectedApp(applications.find(app => {
                return app.app_name === currentApp;
            }));
    }, [applications]);

    function handleSelectApp(app) {
        setSelectedApp(app);
    }

    function handleCleanApp(clean) {
        setIsCleanModalVisible(false);
        if (selectedApp) {
            confirm({
                title: 'Clean application',
                icon: <ExclamationCircleOutlined/>,
                content: `Do you really want to clean want to clean application ${clean.kind} older than ${clean.count} ${clean.unit}`,
                onOk() {
                    setApplicationPurging(true);
                    service.cleanApplication(selectedApp.app_name, clean.kind, clean.count, clean.unit)
                        .then(handleAPIResponse)
                        .then((_: any) => {
                            message.info("Deletion request processing...")
                        }, handleAPIError)
                        .catch(handleAPIError)
                        .finally(() => {
                            setApplicationPurging(false);
                        });
                }
            });
        }
    }

    function handlePurgeApp() {
        if (selectedApp) {
            confirm({
                title: 'Purge application',
                icon: <ExclamationCircleOutlined/>,
                content: 'Do you want to purge all events from selected application?',
                onOk() {
                    setApplicationPurging(true);
                    service.purgeApplication(selectedApp.app_name)
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
                    service.deleteApplication(selectedApp.app_name)
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
            <Modal
                footer={[
                    <Button form="cleanForm" key="submit" htmlType="submit">
                        Clean
                    </Button>
                ]}
                onCancel={() => setIsCleanModalVisible(false)}
                visible={isCleanModalVisible}
            >
                <Form id="cleanForm" onFinish={handleCleanApp}
                      initialValues={{count: 60, unit: "days", kind: "task"}}
                      style={{marginTop: 20}}
                >
                    <FormItem label="Clean" name="kind" style={{width: 130}}>
                        <Select>
                            <Option value="task">Tasks</Option>
                            <Option value="worker">Workers</Option>
                        </Select>
                    </FormItem>
                    <Input.Group compact style={{marginTop: 16}}>
                        <Text style={{marginTop: 4, marginRight: 4}}>Older than: </Text>
                        <FormItem name="count">
                            <InputNumber min={1} max={1000} step={1}
                                         placeholder="count"
                            />
                        </FormItem>
                        <FormItem name="unit">
                            <Select style={{width: 80}}>
                                <Option value="minutes">Minutes</Option>
                                <Option value="hours">Hours</Option>
                                <Option value="days">Days</Option>
                            </Select>
                        </FormItem>
                    </Input.Group>
                </Form>
            </Modal>
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
                            currentApp == selectedApp.app_name ? <Tag color="blue">Current</Tag> : <></>
                        }
                        subTitle={selectedApp.app_description}
                        extra={[
                            <Button key="1" type="dashed" danger ghost onClick={e => setIsCleanModalVisible(true)}
                                    loading={applicationPurging}>
                                Clean
                            </Button>,
                            <Button key="2" type="dashed" danger ghost onClick={handlePurgeApp}
                                    loading={applicationPurging}>
                                Purge
                            </Button>,
                            <Button key="3" danger ghost onClick={handleDeleteApp}
                                    loading={applicationDeleting}>
                                Delete
                            </Button>,
                        ]}
                    >
                        <Card size="small" style={{marginBottom: "24px"}}>
                            <Row style={{marginBottom: "16px"}}>
                                <Space direction="horizontal">
                                    <Text strong>API KEY</Text>
                                    <Text copyable code>{selectedApp.app_key}</Text>
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

                            <Divider>agent subscription snippet</Divider>

                            <Row>
                                <SyntaxHighlighter customStyle={{width: "100%"}} style={atelierCaveDark}
                                                   language="json">
                                    {agentSubscriptionsSnippet(selectedApp)}
                                </SyntaxHighlighter>
                            </Row>
                        </Card>

                        <Triggers selectedApp={selectedApp} setSelectedApp={setSelectedApp}/>

                        <Indices selectedApp={selectedApp}/>
                    </PageHeader>
                    }
                </Col>
            </Row>
        </Row>
    )
};

export default Applications
