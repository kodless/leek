import React, {useState} from 'react'
import {Button, Input, Form, Modal, Select} from 'antd'
import {DeploymentUnitOutlined, ContainerOutlined} from "@ant-design/icons";


import {useApplication} from "../../context/ApplicationProvider";
import {ApplicationService} from "../../api/application";
import {handleAPIError, handleAPIResponse} from "../../utils/errors"


const FormItem = Form.Item;
const Option = Select.Option;

const CreateApp = (props) => {

    const [form] = Form.useForm();
    const service = new ApplicationService();
    const {listApplications, applications} = useApplication();
    const [applicationCreating, setApplicationCreating] = useState<boolean>();

    function createApplication(application) {
        setApplicationCreating(true);
        service.createApplication(application)
            .then(handleAPIResponse)
            .then((application: any) => {
                props.setCreateAppModalVisible(false);
                form.resetFields();
                listApplications();
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => {
                setApplicationCreating(false);
            });
    }

    function reset() {
        props.setCreateAppModalVisible(false);
        form.resetFields();
    }

    return (
        <Modal
            title="New application"
            visible={props.createAppModalVisible}
            onCancel={reset}
            closable={applications.length > 0}
            footer={[
                applications.length > 0 &&
                <Button key="cancel" size="small" onClick={reset}>
                    Cancel
                </Button>,
                <Button form="createApp" key="submit" htmlType="submit" size="small" type="primary"
                        loading={applicationCreating}>
                    Create
                </Button>
            ]}
        >
            <Form onFinish={createApplication}
                  form={form} id="createApp">
                <FormItem
                    name="app_name"
                    rules={[
                        {
                            required: true,
                            message: 'Please input application name!'
                        },
                        {
                            pattern: /^[a-z]*$/g,
                            message: "Wrong app name, only lowercase letters allowed!"
                        },
                        {
                            min: 3,
                            max: 16,
                            message: 'App name must be between 3-16 characters.'
                        },
                    ]}
                >
                    <Input prefix={<DeploymentUnitOutlined style={{fontSize: 13}}/>} placeholder="Application name"/>
                </FormItem>

                <FormItem
                    name="app_description"
                    rules={[
                        {required: true, message: 'Please input application description!'},
                        {
                            max: 46,
                            message: 'App description must be a maximum of 46 characters.'
                        },
                    ]}
                >
                    <Input prefix={<ContainerOutlined style={{fontSize: 13}}/>} placeholder="Short description"/>
                </FormItem>

            </Form>
        </Modal>
    )
};

export default CreateApp;
