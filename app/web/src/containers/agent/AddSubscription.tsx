import React from 'react'
import {Button, Modal, Form, Input, Divider, Space, Select, InputNumber} from 'antd'
import {DeploymentUnitOutlined, NodeIndexOutlined} from "@ant-design/icons";


const FormItem = Form.Item;
const Option = Select.Option;

const AddSubscription = (props) => {
    return (
        <Modal
            title={<Space><NodeIndexOutlined />Add Subscription</Space>}
            visible={props.visible}
            onCancel={props.reset}
            footer={[
                <Button key="cancel" size="small" onClick={props.reset}>
                    Cancel
                </Button>,
                <Button form="addSubscription"
                        key="submit"
                        htmlType="submit"
                        size="small"
                        type="primary"
                        loading={props.loading}>
                    Create
                </Button>
            ]}
        >
            <Form onFinish={props.onAdd}
                  form={props.form} id="addSubscription"
                  initialValues={{type: "RabbitMQ"}}>

                <FormItem name="type">
                    <Select>
                        <Option value="RabbitMQ">RabbitMQ</Option>
                        <Option value="Redis">Redis</Option>
                        <Option value="SQS" disabled>SQS (Not Yet Supported)</Option>
                    </Select>
                </FormItem>

                <FormItem
                    name="name"
                    rules={[
                        {required: true, message: 'Please input subscription name!'},]}
                >
                    <Input placeholder="name"/>
                </FormItem>

                <FormItem
                    name="broker"
                    rules={[
                        {required: true, message: 'Please input broker url!'}]}
                >
                    <Input prefix={<DeploymentUnitOutlined style={{fontSize: 13}}/>} placeholder="Broker"/>
                </FormItem>

                <FormItem
                    name="backend"
                    rules={[]}
                >
                    <Input prefix={<DeploymentUnitOutlined style={{fontSize: 13}}/>} placeholder="Backend"/>
                </FormItem>

                <FormItem
                    name="app_env"
                    rules={[
                        {required: true, message: 'Please input environment tag!'},
                    ]}
                >
                    <Input placeholder="Environment Tag - eg: prod"/>
                </FormItem>

                <Divider/>

                <FormItem
                    name="exchange"
                    rules={[]}
                >
                    <Input placeholder="Exchange - default: celeryev"/>
                </FormItem>

                <FormItem
                    name="queue"
                    rules={[]}
                >
                    <Input placeholder="Queue - default: leek.fanout"/>
                </FormItem>

                <FormItem
                    name="routing_key"
                    rules={[]}
                >
                    <Input placeholder="Routing Key - default: #"/>
                </FormItem>

                <FormItem
                    name="concurrency_pool_size"
                    rules={[]}
                >
                    <InputNumber min={1} max={20} step={1}
                                 placeholder="Concurrency pool size - default: 1"
                                 style={{width: "100%"}}
                    />
                </FormItem>
            </Form>
        </Modal>
    )
};

export default AddSubscription
