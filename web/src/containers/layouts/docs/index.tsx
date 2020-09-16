import React, {useState} from 'react'
import {Link} from 'gatsby'
import {Col, Layout, Menu, Row, Typography, Button} from 'antd';
import {
    DesktopOutlined,
    PieChartOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import Image from "../../../components/image";

const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;
const Title = Typography.Title;


export function DocsLayout({children}: any) {

    const [collapsed, setCollapsed] = useState<boolean>();

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
                <Row justify="center" style={{width: "100%", marginBottom: "30px", padding: 5}}>
                    <Col>
                        <div style={{width: "30px"}}>
                            <Image alt="Logo"/>
                        </div>
                    </Col>
                    <Col><Title level={3} style={{color: "#fff"}}>LEEK</Title></Col>
                </Row>
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                    <Menu.Item key="/docs/introductions" icon={<PieChartOutlined />}>
                        Introduction
                    </Menu.Item>
                    <SubMenu key="/docs/architecture" icon={<DesktopOutlined />} title="Architecture">
                        <Menu.Item key="/docs/architecture/components">Components</Menu.Item>
                        <Menu.Item key="/docs/architecture/authn-authz">AuthN/AuthZ</Menu.Item>
                        <Menu.Item key="/docs/architecture/variables">Variables</Menu.Item>
                        <Menu.Item key="/docs/architecture/index">Index</Menu.Item>
                    </SubMenu>
                    <SubMenu key="/docs/getting-started" icon={<DesktopOutlined />} title="Getting started">
                        <Menu.Item key="/docs/getting-started/api">API</Menu.Item>
                        <Menu.Item key="/docs/getting-started/web">Web</Menu.Item>
                        <Menu.Item key="/docs/getting-started/index">Index DB</Menu.Item>
                        <Menu.Item key="/docs/getting-started/agent">Agent</Menu.Item>
                    </SubMenu>
                    <SubMenu key="/docs/integrations" icon={<UserOutlined />} title="Integrations">
                        <Menu.Item key="/docs/integrations/rabbitmq">RabbitMQ</Menu.Item>
                        <Menu.Item key="/docs/integrations/redis">Redis</Menu.Item>
                        <Menu.Item key="/docs/integrations/sqs">SQS</Menu.Item>
                    </SubMenu>
                </Menu>
            </Sider>
            <Layout>
                <Header
                        style={{
                            background: '#fff',
                            padding: 0,
                            borderBottom: "1px solid #f0f0f0"
                        }}
                >
                    <div style={{float: "right", marginRight: 20}}>
                        <Link to="/app">
                            <Button size="small" type="dashed">Application</Button>
                        </Link>
                    </div>
                </Header>
                <Content style={{ margin: '0 16px'}}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    )
}

export default DocsLayout
