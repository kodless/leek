import React from 'react'
import {Helmet} from 'react-helmet'
import {Button, Col, Layout, Row, Typography} from 'antd'
import {Link} from "gatsby";
import Image from "../components/Image";
import {DeploymentUnitOutlined, BookOutlined, LoginOutlined} from "@ant-design/icons";

const {Content} = Layout;

const Title = Typography.Title;
const Text = Typography.Text;

const IndexPage = () => {
    return (
        <>
            <Helmet
                title="Leek"
                meta={[
                    {name: 'description', content: 'Celery tasks monitoring'},
                    {name: 'keywords', content: 'celery, tasks, flower, rabbitmq'},
                ]}
            >
                <html lang="en"/>
            </Helmet>

            <Layout>
                <Layout.Header
                    style={{
                        position: 'fixed',
                        zIndex: 1,
                        width: '100%',
                        background: '#fff',
                        borderBottom: "1px solid #f0f0f0"
                    }}>
                    <Row justify="center">
                        <Col style={{
                            width: '40px',
                            height: '40px',
                            margin: '5px 20px 5px 0',
                            float: 'left'
                        }}>
                            <Link to="/app">
                                <Image alt="Logo"/>
                            </Link>
                        </Col>
                        <Col xxl={16} xl={16} md={16} lg={20} sm={20} xs={20}>
                            <Row justify="space-between">
                                <Col>
                                    <Title style={{margin: 0}} level={1}>Leek</Title>
                                </Col>
                                <Col key="/logout" style={{float: 'right'}}>
                                    <Link to="/app">
                                        <Button size="small" type="primary" style={{textAlign: "center"}}>
                                            <DeploymentUnitOutlined/>
                                            <Text strong style={{color: "white"}}>Application</Text>
                                        </Button>
                                    </Link>
                                </Col>
                            </Row>
                        </Col>
                    </Row>


                </Layout.Header>
                <Content
                    style={{
                        padding: '0 40px',
                        marginTop: 64,
                        paddingTop: 150,
                    }}
                >
                    <Row justify="center">
                        <Col xxl={16} xl={16} md={16} lg={20} sm={24} xs={24}>
                            <Title level={4} type="secondary" style={{fontWeight: 450}}>Celery Tasks Monitoring Tool</Title>
                            <Title level={1} style={{fontSize: 60, marginTop: 20}}>The only celery tasks monitoring tool that
                                can catch them all.</Title>
                            <Title level={4} type="secondary" style={{fontWeight: 450}}>
                                Fanout, catch, store, index, search celery tasks/events from different brokers. Inspect and
                                monitor tasks with handy charts/metrics and build conditional triggers to fanout critical
                                events to Slack.
                            </Title>

                            <Row style={{marginTop: 40}}>
                                <Link to="/app">
                                    <Button style={{marginRight: 30, height: 50}}>
                                        <LoginOutlined /> <Text strong>Sign In</Text>
                                    </Button>
                                </Link>
                                <Link to="/docs">
                                    <Button style={{height: 50}} type="primary" icon={<BookOutlined/>}>
                                        <Text strong style={{color: "white"}}>Getting started</Text>
                                    </Button>
                                </Link>
                            </Row>
                        </Col>
                    </Row>
                </Content>
            </Layout>
        </>
    )
};

export default IndexPage
