import React, {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet'
import {Card, Row, Button, Space, Typography, Col} from "antd";
import {DeploymentUnitOutlined} from "@ant-design/icons";

import {adaptTime} from "../utils/date";
import {AgentState} from '../components/tags/AgentState'
import {AgentService} from "../api/agent";
import {handleAPIError, handleAPIResponse} from "../utils/errors";
import Subscriptions from "../containers/agent/Subscriptions";


const Text = Typography.Text;

const AgentPage = () => {

    const service = new AgentService();

    const [loading, setLoading] = useState<boolean>();
    const [agent, setAgent] = useState<any>();


    const retrieveAgent = () => {
        setLoading(true);
        service.retrieveAgent()
            .then(handleAPIResponse)
            .then((agent: any) => {
                setAgent(agent);
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => setLoading(false));
    };

    const startOrRestartAgent = () => {
        setLoading(true);
        service.startOrRestartAgent()
            .then(handleAPIResponse)
            .then((agent: any) => {
                console.log(agent);
                setAgent(agent);
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => setLoading(false));
    };

    const stopAgent = () => {
        setLoading(true);
        service.stopAgent()
            .then(handleAPIResponse)
            .then((agent: any) => {
                console.log(agent);
                setAgent(agent);
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => setLoading(false));
    };


    useEffect(() => {
        retrieveAgent();
    }, []);

    return (
        <>
            <Helmet
                title="Agent"
                meta={[
                    {name: 'description', content: 'Agent configuration'},
                    {name: 'keywords', content: 'celery, tasks'},
                ]}
            >
                <html lang="en"/>
            </Helmet>
            <Row justify="center" style={{width: "100%", marginBottom: 13}}>
                <Card
                    size="small" style={{width: "100%"}}
                    title={
                        <Space>
                            <DeploymentUnitOutlined/>
                            <Text strong>Agent Process</Text>
                        </Space>
                    }
                    loading={loading}
                    extra={[
                        <Button key="restart" size="small" disabled={loading} type="primary" onClick={startOrRestartAgent}
                                style={{marginRight: 10, color: "#222"}}>Start/Restart</Button>,
                        <Button key="stop" size="small" disabled={loading || (agent && agent.statename === "STOPPED")} danger
                                onClick={stopAgent}>Stop</Button>,
                    ]}>

                    {agent &&
                    <>
                        <Row>
                            <Space direction="horizontal" style={{marginBottom: "16px"}}>
                                <Text strong>State</Text>
                                <AgentState state={agent.statename}/>
                            </Space>
                        </Row>

                        <Row style={{marginBottom: "16px"}}>
                            <Space direction="horizontal">
                                <Text strong>Last started</Text>
                                <Text copyable code>{adaptTime(agent.start * 1000)}</Text>
                            </Space>
                        </Row>

                        <Row style={{marginBottom: "16px"}}>
                            <Space direction="horizontal">
                                <Text strong>Last stopped</Text>
                                <Text code>{adaptTime(agent.stop * 1000)}</Text>
                            </Space>
                        </Row>

                        <Row>
                            <Space direction="horizontal">
                                <Text strong>Description</Text>
                                <Text code>{agent.description}</Text>
                            </Space>
                        </Row>
                    </>
                    }
                </Card>
            </Row>

            <Subscriptions/>

        </>
    )
};

export default AgentPage
