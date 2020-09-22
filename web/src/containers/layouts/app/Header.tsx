import React from 'react'
import {Link} from 'gatsby'
import {Menu, Layout, Button, Dropdown, Col, Row} from 'antd'
import {Location} from '@reach/router';
import {
    RobotFilled, UnorderedListOutlined, RadarChartOutlined, LogoutOutlined,
    ClearOutlined, DownOutlined, MenuOutlined
} from '@ant-design/icons';

import Image from "../../../components/Image";
import {useAuth} from "../../../context/AuthProvider";
import {useApplication} from "../../../context/ApplicationProvider";

const {SubMenu} = Menu;


const Header = () => {
    const {logout} = useAuth();
    const {applications, selectApplication, selectEnv, currentApp, currentEnv, seenEnvs} = useApplication();


    function handleAppSelect(e) {
        selectApplication(e.key)
    }

    function handleEnvSelect(e) {
        selectEnv(e.key)
    }

    const apps = <Menu
        onClick={handleAppSelect}
        selectedKeys={currentApp ? [currentApp] : []}
        selectable
    >
        {applications.map((app, index) => (
            <Menu.Item key={app["app_name"]}>
                {app["app_name"]}
            </Menu.Item>
        ))}
    </Menu>;

    const menuItems = [
        <Menu.Item key="/app/workers">
            <Link
                to="/app/workers"
            >
                <RobotFilled/>
                Workers
            </Link>
        </Menu.Item>,
        <Menu.Item key="/app/tasks">
            <Link to="/app/tasks">
                <UnorderedListOutlined/>
                Tasks
            </Link>
        </Menu.Item>,

        <Menu.Item key="/app/monitor">
            <Link to="/app/monitor">
                <RadarChartOutlined/>
                Monitor
            </Link>
        </Menu.Item>,

        <Menu.Item key="/app/applications">
            <Link to="/app/applications">
                <ClearOutlined/>
                Applications
            </Link>
        </Menu.Item>
    ];

    const envs = <Menu
        onClick={handleEnvSelect}
        selectedKeys={currentEnv ? [currentEnv] : []}
        selectable
    >
        {seenEnvs.map((env, index) => (
            <Menu.Item key={env["key"]}>
                {env["key"]}
            </Menu.Item>
        ))}
    </Menu>;

    return (
        <Location>
            {({location}) => {
                return <Layout.Header
                    style={{
                        position: 'fixed',
                        zIndex: 1,
                        width: '100%',
                        background: '#fff',
                        borderBottom: "1px solid #f0f0f0"
                    }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        margin: '5px 20px 5px 0',
                        float: 'left'
                    }}>
                        <Link to="/app">
                            <Image alt="Logo"/>
                        </Link>
                    </div>
                    <Row justify="space-between">
                        <Col xxl={18} xl={18} lg={14} md={0} sm={0} xs={0}>
                            <Menu mode="horizontal"
                                  selectedKeys={[location.pathname]}
                                  style={{lineHeight: '48px', borderBottom: "0"}}>
                                {menuItems}
                            </Menu>
                        </Col>
                        <Col xxl={0} xl={0} lg={0} md={6} sm={6} xs={6}>
                            <Menu mode="horizontal"
                                  selectedKeys={[location.pathname]}
                                  style={{lineHeight: '48px', borderBottom: "0"}}>
                                <SubMenu key="sub2" icon={<MenuOutlined/>}>
                                    {menuItems}
                                </SubMenu>
                            </Menu>
                        </Col>
                        <Col>
                            <Row style={{float: 'right'}} gutter={10}>
                                {seenEnvs.length > 0 &&
                                <Col>
                                    <Dropdown.Button
                                        size="small"
                                        icon={<DownOutlined/>}
                                        overlay={envs}
                                        placement="bottomLeft"
                                    >
                                        {currentEnv ? currentEnv : "Choose env"}
                                    </Dropdown.Button>
                                </Col>}

                                <Col>
                                    <Dropdown.Button
                                        size="small"
                                        icon={<DownOutlined/>}
                                        overlay={apps}
                                        placement="bottomLeft"
                                    >
                                        {currentApp ? currentApp : "Choose app"}
                                    </Dropdown.Button>
                                </Col>

                                <Col key="/logout" style={{float: 'right'}}>
                                    <Button size="small" danger onClick={logout} style={{textAlign: "center"}}>
                                        <LogoutOutlined/>
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                </Layout.Header>
            }}
        </Location>

    )
};

export default Header
