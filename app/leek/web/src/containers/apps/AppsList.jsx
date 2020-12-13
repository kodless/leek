import React, {useEffect, useState} from 'react'
import {Row, List, Button, Empty, Typography, Space} from 'antd'
import {AppstoreAddOutlined} from "@ant-design/icons";

import CreateApp from "./CreateApp";
import {useApplication} from "../../context/ApplicationProvider";

const Text = Typography.Text;

const AppsList = (props) => {

    const {applications, listApplications} = useApplication();
    const [createAppModalVisible, setCreateAppModalVisible] = useState();

    function switchApp(app) {
        props.onSelectApp(app)
    }

    useEffect(() => {
        listApplications()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <CreateApp createAppModalVisible={createAppModalVisible}
                       setCreateAppModalVisible={setCreateAppModalVisible}/>
            <List
                split
                size="small"
                // style={{width: "100%", height: "100%"}}
                style={{width: "100%"}}
                locale={{
                    emptyText: <div style={{textAlign: 'center'}}>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <span>
                                    No <a href="#API">applications</a> found
                                </span>
                            }
                        />
                    </div>
                }}
                header={
                    <Space direction="horizontal">
                        <Button onClick={() => setCreateAppModalVisible(true)} size="small" type="primary" ghost
                                icon={<AppstoreAddOutlined/>}/>
                    </Space>
                }
                bordered
                dataSource={applications}
                renderItem={app =>
                    props.selectedApp && app["app_name"] === props.selectedApp.app_name ?
                        <List.Item style={{paddingRight: 0, backgroundColor: "#eee"}}
                                   extra={<Row style={{
                                       backgroundColor: "#00BFA6",
                                       height: "50px",
                                       width: "6px"
                                   }}>&nbsp;</Row>}>
                            <Space direction="vertical">
                                <Text style={{color: "#00BFA6"}}>{app["app_name"]}</Text>
                                <Text>{app["app_description"]}</Text>
                            </Space>
                        </List.Item>
                        :
                        <List.Item style={{cursor: "pointer"}} onClick={() => switchApp(app)}>
                            <List.Item.Meta
                                title={<a href="https://ant.design"> {app["app_name"]}</a>}
                                description={app["app_description"]}
                            />
                        </List.Item>
                }
            />
        </>
    )
};

export default AppsList
