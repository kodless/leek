import React from 'react'
import {Link} from 'gatsby'
import {Menu, Layout, Button, Dropdown, Col, Row, Switch} from 'antd'
import {Location} from '@reach/router';
import {
    RobotFilled, UnorderedListOutlined, RadarChartOutlined, LogoutOutlined, BoxPlotOutlined,
    AppstoreOutlined, DownOutlined, MenuOutlined, BugOutlined, DeploymentUnitOutlined, ControlOutlined
} from '@ant-design/icons';

import Image from "../../components/Image";
import {useAuth} from "../../context/AuthProvider";
import {useApplication} from "../../context/ApplicationProvider";
import env from "../../utils/vars";
import {useThemeSwitcher} from "react-css-theme-switcher";

const {SubMenu} = Menu;


const Header = () => {
    const {logout} = useAuth();
    const {applications, selectApplication, selectEnv, currentApp, currentEnv, seenEnvs} = useApplication();

    const { switcher, currentTheme, themes } = useThemeSwitcher();

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
        <Menu.Item key="/workers">
            <Link
                to="/workers"
            >
                <RobotFilled/>
                Workers
            </Link>
        </Menu.Item>,

        <Menu.Item key="/tasks">
            <Link to="/tasks">
                <UnorderedListOutlined/>
                Tasks
            </Link>
        </Menu.Item>,

        <Menu.Item key="/control">
            <Link to="/control">
                <ControlOutlined />
                Control
            </Link>
        </Menu.Item>,

        <Menu.Item key="/queues">
            <Link to="/queues">
                <BoxPlotOutlined />
                Queues
            </Link>
        </Menu.Item>,

        <Menu.Item key="/issues">
            <Link to="/issues">
                <BugOutlined/>
                Issues
            </Link>
        </Menu.Item>,

        <Menu.Item key="/monitor">
            <Link to="/monitor">
                <RadarChartOutlined/>
                Monitor
            </Link>
        </Menu.Item>,

        <Menu.Item key="/agent">
            <Link to="/agent">
                <DeploymentUnitOutlined/>
                Agent
            </Link>
        </Menu.Item>,

        <Menu.Item key="/applications">
            <Link to="/applications">
                <AppstoreOutlined/>
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

    const toggleTheme = (isChecked) => {
        if (isChecked)
            localStorage.setItem("theme", "dark")
        else
            localStorage.setItem("theme", "light")
        switcher({ theme: isChecked ? themes.dark : themes.light });
    };

    return (
        <Location>
            {({location}) => {
                return <Layout.Header
                    style={{
                        position: 'fixed',
                        zIndex: 1,
                        width: '100%',
                        // borderBottom: "1px solid #f0f0f0"
                    }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        margin: '5px 20px 5px 0',
                        float: 'left'
                    }}>
                        <Link to="/">
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
                                        <span style={{color: "#00BFA6"}}>env:&nbsp;</span>{currentEnv ? currentEnv : "-"}
                                    </Dropdown.Button>
                                </Col>}

                                <Col>
                                    <Dropdown.Button
                                        size="small"
                                        icon={<DownOutlined/>}
                                        overlay={apps}
                                        placement="bottomLeft"
                                    >
                                        <span style={{color: "#00BFA6"}}>app:&nbsp;</span>{currentApp ? currentApp : "-"}
                                    </Dropdown.Button>
                                </Col>

                                <Col>
                                    <Switch
                                        checked={currentTheme === themes.dark}
                                        onChange={toggleTheme}
                                        checkedChildren={<span>🌙</span>}
                                        unCheckedChildren={<span>☀</span>}
                                        style={{background:"#555"}}
                                    />
                                </Col>

                                {env.LEEK_API_ENABLE_AUTH !== "false" &&
                                <Col key="/logout" style={{float: 'right'}}>
                                    <Button size="small" danger onClick={logout} style={{textAlign: "center"}}>
                                        <LogoutOutlined/>
                                    </Button>
                                </Col>
                                }
                            </Row>
                        </Col>
                    </Row>

                </Layout.Header>
            }}
        </Location>

    )
};

export default Header
