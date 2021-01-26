import React from 'react'
import {Button, Modal, Form, Input, Divider, Space} from 'antd'
import {DeploymentUnitOutlined, BellOutlined} from "@ant-design/icons";


const FormItem = Form.Item;

const AddSubscription = (props) => {
    return (
        <Modal
            title={<Space><BellOutlined/>Add Subscription</Space>}
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
                  initialValues={{}}>
                <FormItem
                    name="name"
                    rules={[
                        {required: true, message: 'Please input subscription name!'},]}
                >
                    <Input prefix={<DeploymentUnitOutlined style={{fontSize: 13}}/>} placeholder="name"/>
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
                    <Input prefix={<DeploymentUnitOutlined style={{fontSize: 13}}/>}
                           placeholder="Environment Tag - eg: prod"/>
                </FormItem>

                <Divider/>

                <FormItem
                    name="exchange"
                    rules={[]}
                >
                    <Input prefix={<DeploymentUnitOutlined style={{fontSize: 13}}/>}
                           placeholder="Exchange - default: celeryev"/>
                </FormItem>

                <FormItem
                    name="queue"
                    rules={[]}
                >
                    <Input prefix={<DeploymentUnitOutlined style={{fontSize: 13}}/>}
                           placeholder="Queue - default: leek.fanout"/>
                </FormItem>

                <FormItem
                    name="routing_key"
                    rules={[]}
                >
                    <Input prefix={<DeploymentUnitOutlined style={{fontSize: 13}}/>}
                           placeholder="Routing Key - default: #"/>
                </FormItem>
            </Form>
        </Modal>
    )
};

export default AddSubscription
