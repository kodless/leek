import React, {useEffect, useState} from 'react'
import {
    Row, List, Button, Col, Card, Typography, Tag, Table, Modal, Form,
    Input, Divider, Empty, Space, message
} from 'antd'
import {AppstoreAddOutlined, DeploymentUnitOutlined, BellOutlined} from "@ant-design/icons";

import SubscriptionDataColumns from "../../components/data/SubscriptionData";

import {AgentService} from "../../api/agent";
import {handleAPIError, handleAPIResponse} from "../../utils/errors";
import {useApplication} from "../../context/ApplicationProvider";


const Text = Typography.Text;
const FormItem = Form.Item;

const Subscriptions = (props) => {

    const [form] = Form.useForm();
    const service = new AgentService();
    const {currentApp} = useApplication();

    const [subscriptions, setSubscriptions] = useState<any>();

    const [addSubscriptionModalVisible, setAddSubscriptionModalVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        getSubscriptions()
    }, [currentApp]);

    const getSubscriptions = () => {
        setLoading(true);
        service.getSubscriptions(currentApp)
            .then(handleAPIResponse)
            .then((subscriptions: any) => {
                setSubscriptions(subscriptions);
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => setLoading(false));
    };

    function doAddSubscription(subscription) {
        setLoading(true);
        service.addSubscription(currentApp, subscription)
            .then(handleAPIResponse)
            .then((subscription: any) => {
                reset();
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => {
                setLoading(false);
            });
    }

    function doDeleteSubscription(subscription_name) {
        setLoading(true);
        service.deleteSubscription(currentApp, subscription_name)
            .then(handleAPIResponse)
            .then((_: any) => {
                setSubscriptions(subscriptions.filter(
                    item => item.name != subscription_name
                ));
                message.info("Subscription deleted!")
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => {
                setLoading(false);
            });
    }

    function reset() {
        setAddSubscriptionModalVisible(false);
        form.resetFields();
    }

    const formItems = (<>
        <FormItem
            name="broker"
            rules={[
                {required: true, message: 'Please input broker url!'},
                {
                    type: "url",
                    message: "This field must be a valid url."
                }]}
        >
            <Input prefix={<DeploymentUnitOutlined style={{fontSize: 13}}/>} placeholder="Broker"/>
        </FormItem>

        <FormItem
            name="backend"
            rules={[
                {required: true, message: 'Please input backend url!'},
                {
                    type: "url",
                    message: "This field must be a valid url."
                }]}
        >
            <Input prefix={<DeploymentUnitOutlined style={{fontSize: 13}}/>} placeholder="Backend"/>
        </FormItem>

        <Divider/>
    </>);


    return (
        <Row style={{width: "100%", marginBottom: "16px"}}>

            {/*Add Subscription*/}
            <Modal
                title={<Space><BellOutlined/>Add Subscription</Space>}
                visible={addSubscriptionModalVisible}
                onCancel={reset}
                footer={[
                    <Button key="cancel" size="small" onClick={reset}>
                        Cancel
                    </Button>,
                    <Button form="addSubscription"
                            key="submit"
                            htmlType="submit"
                            size="small"
                            type="primary"
                            loading={loading}>
                        Create
                    </Button>
                ]}
            >
                <Form onFinish={doAddSubscription}
                      form={form} id="addSubscription"
                      initialValues={{type: "slack", patterns: "all", enabled: false}}>
                    {formItems}
                </Form>
            </Modal>

            <Card size="small" style={{width: "100%"}}
                  bodyStyle={{paddingBottom: 0, paddingRight: 0, paddingLeft: 0}}
                  loading={loading}
                  title={<Row justify="space-between">
                      <Col>
                          <Space>
                              <BellOutlined/>
                              <Text strong>Agent Subscriptions</Text>
                          </Space>
                      </Col>
                      <Col>
                          <Button
                              onClick={() => setAddSubscriptionModalVisible(true)}
                              size="small"
                              type="primary"
                              ghost
                              icon={<AppstoreAddOutlined/>}/>
                      </Col>
                  </Row>}
            >
                <Table dataSource={subscriptions}
                       columns={SubscriptionDataColumns({
                           handleDeleteSubscription: doDeleteSubscription,
                           loading: loading
                       })}
                       showHeader={false}
                       pagination={false}
                       size="small"
                       rowKey="name"
                       style={{width: "100%"}}
                       scroll={{x: "100%"}}
                       locale={{
                           emptyText: <div style={{textAlign: 'center'}}>
                               <Empty
                                   image={Empty.PRESENTED_IMAGE_SIMPLE}
                                   description={
                                       <span>No <a href="#API">subscription</a> found</span>
                                   }
                               />
                           </div>
                       }}
                       expandable={{
                           expandedRowRender: record => <>
                               <Row justify="space-between" style={{marginBottom: 16}}>
                                   <Col span={12}>
                                       <List.Item.Meta
                                           title={"Virtual Host"}
                                           description={<Tag>{record.virtual_host}</Tag>}
                                       />
                                   </Col>
                                   <Col span={12}>
                                       <List.Item.Meta
                                           title={"Exchange"}
                                           description={<Tag>{record.exchange}</Tag>}
                                       />
                                   </Col>
                               </Row>
                               <Row justify="space-between">
                                   <Col span={12}>
                                       <List.Item.Meta
                                           title={"Routing key"}
                                           description={<Tag>{record.routing_key}</Tag>}
                                       />
                                   </Col>
                                   <Col span={12}>
                                       <List.Item.Meta
                                           title={"Queue"}
                                           description={<Tag>{record.queue}</Tag>}
                                       />
                                   </Col>
                               </Row>
                           </>,
                           rowExpandable: record => true,
                       }}
                />
            </Card>
        </Row>
    )
};

export default Subscriptions
