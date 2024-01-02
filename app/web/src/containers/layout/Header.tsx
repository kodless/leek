import React from "react";
import { Link } from "gatsby";
import {
  Menu,
  Layout,
  Button,
  Dropdown,
  Col,
  Row,
  Switch,
  Image,
  Space,
} from "antd";
import { Location } from "@reach/router";
import {
  RobotFilled,
  UnorderedListOutlined,
  RadarChartOutlined,
  LogoutOutlined,
  BoxPlotOutlined,
  AppstoreOutlined,
  DownOutlined,
  MenuOutlined,
  BugOutlined,
  DeploymentUnitOutlined,
  ControlOutlined,
} from "@ant-design/icons";

import { useAuth } from "../../context/AuthProvider";
import { useApplication } from "../../context/ApplicationProvider";
import env from "../../utils/vars";
import { useThemeSwitcher } from "react-css-theme-switcher";
import useSound from "use-sound";

const { SubMenu } = Menu;
const tabs = [
  { key: "workers", name: "Workers", icon: <RobotFilled /> },
  { key: "tasks", name: "Tasks", icon: <UnorderedListOutlined /> },
  { key: "control", name: "Control", icon: <ControlOutlined /> },
  { key: "queues", name: "Queues", icon: <BoxPlotOutlined /> },
  { key: "issues", name: "Issues", icon: <BugOutlined /> },
  { key: "monitor", name: "Monitor", icon: <RadarChartOutlined /> },
  { key: "agent", name: "Agent", icon: <DeploymentUnitOutlined /> },
  { key: "applications", name: "Applications", icon: <AppstoreOutlined /> },
];

const Header = () => {
  const { logout } = useAuth();
  const {
    applications,
    selectApplication,
    selectEnv,
    currentApp,
    currentEnv,
    seenEnvs,
  } = useApplication();

  const { switcher, currentTheme, themes } = useThemeSwitcher();

  const [playOn] = useSound(
      '/sounds/switch-on.mp3',
      { volume: 0.50 }
  );
  const [playOff] = useSound(
      '/sounds/switch-off.mp3',
      { volume: 0.50 }
  );

  function handleAppSelect(e) {
    selectApplication(e.key);
  }

  function handleEnvSelect(e) {
    selectEnv(e.key);
  }

  const apps = (
    <Menu
      onClick={handleAppSelect}
      selectedKeys={currentApp ? [currentApp] : []}
      selectable
    >
      {applications.map((app, index) => (
        <Menu.Item key={app["app_name"]}>{app["app_name"]}</Menu.Item>
      ))}
    </Menu>
  );

  function getMenuItems(location) {
    return tabs.map((tab) => {
      return (
        <Menu.Item key={`/${tab.key}/`}>
          <Link to={`/${tab.key}/${location.search}`}>
            <Space size={4}>
              {tab.icon} <span>{tab.name}</span>
            </Space>
          </Link>
        </Menu.Item>
      );
    });
  }

  const envs = (
    <Menu
      onClick={handleEnvSelect}
      selectedKeys={currentEnv ? [currentEnv] : []}
      selectable
    >
      {seenEnvs.map((env, index) => (
        <Menu.Item key={env["key"]}>{env["key"]}</Menu.Item>
      ))}
    </Menu>
  );

  const toggleTheme = (isChecked) => {
    if (isChecked) localStorage.setItem("theme", "dark");
    else localStorage.setItem("theme", "light");
    if (isChecked) {
      switcher({ theme: themes.dark });
      playOff()
    }
    else {
      switcher({ theme: themes.light });
      playOn()
    }
  };

  return (
    <Location>
      {({ location }) => {
        return (
          <Layout.Header
            style={{
              position: "fixed",
              zIndex: 1,
              width: "100%",
              // borderBottom: "1px solid #f0f0f0"
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                margin: "5px 20px 5px 0",
                float: "left",
              }}
            >
              <Link to={`/${location.search}`}>
                <Image
                  alt="Logo"
                  width={40}
                  height={40}
                  style={{ margin: 0 }}
                  src="/leek.png"
                  preview={false}
                />
              </Link>
            </div>
            <Row justify="space-between">
              <Col xxl={18} xl={18} lg={14} md={0} sm={0} xs={0}>
                <Menu
                  mode="horizontal"
                  selectedKeys={[location.pathname]}
                  style={{ lineHeight: "48px", borderBottom: "0" }}
                >
                  {getMenuItems(location)}
                </Menu>
              </Col>
              <Col xxl={0} xl={0} lg={0} md={6} sm={6} xs={6}>
                <Menu
                  mode="horizontal"
                  selectedKeys={[location.pathname]}
                  style={{ lineHeight: "48px", borderBottom: "0" }}
                >
                  <SubMenu key="sub2" icon={<MenuOutlined />}>
                    {getMenuItems(location)}
                  </SubMenu>
                </Menu>
              </Col>
              <Col>
                <Row style={{ float: "right" }} gutter={10}>
                  {seenEnvs.length > 0 && (
                    <Col>
                      <Dropdown.Button
                        size="small"
                        icon={<DownOutlined />}
                        overlay={envs}
                        placement="bottomLeft"
                      >
                        <span style={{ color: "#00BFA6" }}>env:&nbsp;</span>
                        {currentEnv ? currentEnv : "-"}
                      </Dropdown.Button>
                    </Col>
                  )}

                  <Col>
                    <Dropdown.Button
                      size="small"
                      icon={<DownOutlined />}
                      overlay={apps}
                      placement="bottomLeft"
                    >
                      <span style={{ color: "#00BFA6" }}>app:&nbsp;</span>
                      {currentApp ? currentApp : "-"}
                    </Dropdown.Button>
                  </Col>

                  <Col>
                    <Switch
                      checked={currentTheme === themes.dark}
                      onChange={toggleTheme}
                      checkedChildren={<span>🌙</span>}
                      unCheckedChildren={<span>☀</span>}
                      style={{ background: "#555" }}
                    />
                  </Col>

                  {env.LEEK_API_ENABLE_AUTH !== "false" && (
                    <Col key="/logout" style={{ float: "right" }}>
                      <Button
                        size="small"
                        danger
                        onClick={logout}
                        style={{ textAlign: "center" }}
                      >
                        <LogoutOutlined />
                      </Button>
                    </Col>
                  )}
                </Row>
              </Col>
            </Row>
          </Layout.Header>
        );
      }}
    </Location>
  );
};

export default Header;
