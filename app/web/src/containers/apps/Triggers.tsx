import React, {useEffect, useState} from 'react'
import {
    Row, List, Button, Col, Card, Typography, Tag, Table, Modal, Form,
    Input, Select, Switch, Divider, Radio, Empty, InputNumber, Space
} from 'antd'
import {AppstoreAddOutlined, DeploymentUnitOutlined, SlackOutlined, BellOutlined} from "@ant-design/icons";

import TriggerDataColumns from "../../components/app/TriggerData";
import {TaskStateClosable} from '../../components/tags/TaskState';

import {ApplicationSearch} from "../../api/application";
import {handleAPIError, handleAPIResponse} from "../../utils/errors";


const Text = Typography.Text;
const FormItem = Form.Item;
const {Option} = Select;

const statesOptions = [
    {value: "QUEUED"},
    {value: "RECEIVED"},
    {value: "STARTED"},
    {value: "SUCCEEDED"},
    {value: "FAILED"},
    {value: "REJECTED"},
    {value: "REVOKED"},
    {value: "RETRY"},
    {value: "RECOVERED"},
    {value: "CRITICAL"},
];

const Triggers = (props) => {

    const [form] = Form.useForm();
    const application = new ApplicationSearch();
    const [createTriggerModalVisible, setCreateTriggerModalVisible] = useState<boolean>(false);
    const [editTriggerModalVisible, setEditTriggerModalVisible] = useState<boolean>(false);
    const [patternType, setPatternType] = useState<string>("all");
    const [loading, setLoading] = useState<boolean>(false);
    const [triggerId, setTriggerId] = useState();


    useEffect(() => {

    }, []);

    function handleAddTrigger(trigger) {
        delete trigger.patterns;
        setLoading(true);
        application.addFanoutTrigger(props.selectedApp.app_name, trigger)
            .then(handleAPIResponse)
            .then((application: any) => {
                props.setSelectedApp(application);
                reset();
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => {
                setLoading(false);
            });
    }

    function handleUpdateTrigger(trigger) {
        delete trigger.patterns;
        setLoading(true);
        application.editFanoutTrigger(props.selectedApp.app_name, triggerId, trigger)
            .then(handleAPIResponse)
            .then((application: any) => {
                props.setSelectedApp(application);
                reset();
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => {
                setLoading(false);
            });
    }

    function handleDeleteTrigger(trigger_id) {
        setLoading(true);
        application.deleteFanoutTrigger(props.selectedApp.app_name, trigger_id)
            .then(handleAPIResponse)
            .then((application: any) => {
                props.setSelectedApp(application)
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => {
                setLoading(false);
            });
    }

    function handleEditTrigger(trigger_id, selected) {
        setTriggerId(trigger_id);
        if (selected.include && selected.include.length) selected.patterns = "include";
        else if (selected.exclude && selected.exclude.length) selected.patterns = "exclude";
        else selected.patterns = "all";
        setPatternType(selected.patterns);
        form.setFieldsValue(selected);
        setEditTriggerModalVisible(true);
    }

    function reset() {
        setCreateTriggerModalVisible(false);
        setEditTriggerModalVisible(false);
        setTriggerId(undefined);
        form.resetFields();
    }

    const formItems = (<>
        <FormItem name="type">
            <Select>
                <Option value="slack"><SlackOutlined/>Slack</Option>
            </Select>
        </FormItem>

        <FormItem
            name="slack_wh_url"
            rules={[
                {required: true, message: 'Please input slack webhook url!'},
                {
                    type: "url",
                    message: "This field must be a valid url."
                }]}
        >
            <Input prefix={<DeploymentUnitOutlined style={{fontSize: 13}}/>} placeholder="Webhook URL"/>
        </FormItem>

        <FormItem name="states">
            <Select
                mode="multiple"
                tagRender={TaskStateClosable}
                style={{width: '100%'}}
                placeholder="States"
                options={statesOptions}
            />
        </FormItem>

        <FormItem name="envs">
            <Select mode="tags" style={{width: '100%'}} placeholder="Environments"/>
        </FormItem>

        <Divider/>

        <FormItem name="runtime_upper_bound">
            <InputNumber style={{width: '100%'}}
                         min={0} max={1000} step={0.00001}
                         placeholder="Runtime upper bound (Only succeeded Tasks)"
            />
        </FormItem>

        <FormItem name="patterns" valuePropName="value">
            <Radio.Group buttonStyle="solid" onChange={e => setPatternType(e.target.value)}>
                <Radio.Button value="all">All tasks</Radio.Button>
                <Radio.Button value="exclude">Exclude</Radio.Button>
                <Radio.Button value="include">Include</Radio.Button>
            </Radio.Group>
        </FormItem>

        {"include" === patternType &&
        <FormItem name="include">
            <Select mode="tags" style={{width: '100%'}} placeholder="Tasks names list or patterns to include"/>
        </FormItem>
        }

        {"exclude" === patternType &&
        <FormItem name="exclude">
            <Select mode="tags" style={{width: '100%'}} placeholder="Tasks names list or patterns to exclude"/>
        </FormItem>
        }

        <FormItem name="enabled" valuePropName="checked">
            <Switch
                checkedChildren="Enabled"
                unCheckedChildren="Disabled"
                defaultChecked
                size="small"/>
        </FormItem>
    </>);


    return (
        <Row style={{width: "100%", marginBottom: "16px"}}>

            {/*Create Trigger*/}
            <Modal
                title={<Space><BellOutlined/>Create Trigger</Space>}
                visible={createTriggerModalVisible}
                onCancel={reset}
                footer={[
                    <Button key="cancel" size="small" onClick={reset}>
                        Cancel
                    </Button>,
                    <Button form="createTrigger"
                            key="submit"
                            htmlType="submit"
                            size="small"
                            type="primary"
                            loading={loading}>
                        Create
                    </Button>
                ]}
            >
                <Form onFinish={handleAddTrigger}
                      form={form} id="createTrigger"
                      initialValues={{type: "slack", patterns: "all", enabled: false}}>
                    {formItems}
                </Form>
            </Modal>

            {/*Edit Trigger*/}
            <Modal
                title={() => <><BellOutlined/> `Edit Trigger ${triggerId}`</>}
                visible={editTriggerModalVisible}
                onCancel={reset}
                footer={[
                    <Button key="cancel" size="small" onClick={reset}>
                        Cancel
                    </Button>,
                    <Button form="editTrigger"
                            key="submit"
                            htmlType="submit"
                            size="small"
                            type="primary"
                            loading={loading}>
                        Update
                    </Button>
                ]}
            >
                <Form onFinish={handleUpdateTrigger}
                      form={form} id="editTrigger">
                    {formItems}
                </Form>
            </Modal>

            <Card size="small" style={{width: "100%"}}
                  bodyStyle={{paddingBottom: 0, paddingRight: 0, paddingLeft: 0}}
                  title={<Row justify="space-between">
                      <Col>
                          <Space>
                              <BellOutlined/>
                              <Text strong>Fanout Triggers</Text>
                          </Space>
                      </Col>
                      <Col>
                          <Button
                              onClick={() => setCreateTriggerModalVisible(true)}
                              size="small"
                              type="primary"
                              ghost
                              icon={<AppstoreAddOutlined/>}/>
                      </Col>
                  </Row>}
            >
                <Table dataSource={props.selectedApp.fo_triggers}
                       columns={TriggerDataColumns({
                           handleEditTrigger: handleEditTrigger,
                           handleDeleteTrigger: handleDeleteTrigger,
                           triggersModifying: loading
                       })}
                       showHeader={false}
                       pagination={false}
                       size="small"
                       rowKey="id"
                       style={{width: "100%"}}
                       scroll={{x: "100%"}}
                       locale={{
                           emptyText: <div style={{textAlign: 'center'}}>
                               <Empty
                                   image={Empty.PRESENTED_IMAGE_SIMPLE}
                                   description={
                                       <span>No <a href="#API">triggers</a> found</span>
                                   }
                               />
                           </div>
                       }}
                       expandable={{
                           expandedRowRender: record => <>
                               <Row justify="space-between">
                                   <Col span={12}>
                                       <List.Item.Meta
                                           style={{marginBottom: 16}}
                                           title={"Webhook URL"}
                                           description={<Tag>{record.slack_wh_url}</Tag>}
                                       />
                                   </Col>
                                   <Col span={12}>
                                       {record.exclude && record.exclude.length > 0 && <List.Item.Meta
                                           style={{marginBottom: 16}}
                                           title={"Exclusions"}
                                           description={record.exclude.map((exclusion, key) =>
                                               <Tag key={key}>{exclusion}</Tag>
                                           )}
                                       />}
                                       {record.include && record.include.length > 0 && <List.Item.Meta
                                           title={"Inclusions"}
                                           description={record.include.map((inclusion, key) =>
                                               <Tag key={key}>{inclusion}</Tag>
                                           )}
                                       />}
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

export default Triggers
