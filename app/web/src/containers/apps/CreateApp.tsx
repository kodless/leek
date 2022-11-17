import React, { useState } from "react";
import {Button, Input, Form, Modal, Select, InputNumber, Typography} from "antd";
import { DeploymentUnitOutlined, ContainerOutlined, NodeIndexOutlined } from "@ant-design/icons";

import { useApplication } from "../../context/ApplicationProvider";
import { ApplicationService } from "../../api/application";
import { handleAPIError, handleAPIResponse } from "../../utils/errors";

const FormItem = Form.Item;
const Option = Select.Option;
const {Paragraph, Text} = Typography;

const CreateApp = (props) => {
  const [form] = Form.useForm();
  const service = new ApplicationService();
  const { listApplications, applications } = useApplication();
  const [applicationCreating, setApplicationCreating] = useState<boolean>();

  function createApplication(application) {
    setApplicationCreating(true);
    service
      .createApplication(application)
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
        applications.length > 0 && (
          <Button key="cancel" size="small" onClick={reset}>
            Cancel
          </Button>
        ),
        <Button
          form="createApp"
          key="submit"
          htmlType="submit"
          size="small"
          type="primary"
          loading={applicationCreating}
        >
          Create
        </Button>,
      ]}
    >
      <Form onFinish={createApplication} form={form} id="createApp">
        <FormItem
          name="app_name"
          rules={[
            {
              required: true,
              message: "Please input application name!",
            },
            {
              pattern: /^[a-z]*$/g,
              message: "Wrong app name, only lowercase letters allowed!",
            },
            {
              min: 3,
              max: 16,
              message: "App name must be between 3-16 characters.",
            },
          ]}
        >
          <Input
            prefix={<DeploymentUnitOutlined style={{ fontSize: 13 }} />}
            placeholder="Application name"
          />
        </FormItem>

        <FormItem
          name="app_description"
          rules={[
            {
              required: true,
              message: "Please input application description!",
            },
            {
              max: 46,
              message: "App description must be a maximum of 46 characters.",
            },
          ]}
        >
          <Input
            prefix={<ContainerOutlined style={{ fontSize: 13 }} />}
            placeholder="Short description"
          />
        </FormItem>

        <FormItem
            name="number_of_shards"
            rules={[
                {
                    type: "number",
                    max: 10,
                    message: 'The input is not a number, max = 10'
                }
            ]}
        >
          <InputNumber
            prefix={<NodeIndexOutlined style={{ fontSize: 13 }} />}
            style={{ width: "100%" }}
            min={1}
            max={10}
            step={1}
            placeholder="Number of shards (DEFAULT: 1)"/>
        </FormItem>

        <Paragraph type={"secondary"}>
            <blockquote>
                <Text type="warning" italic strong>Be sure that the shards are distributed evenly across the data nodes.</Text>
            </blockquote>
            <Text code type="success">
                Number of shards for index = k * (number of data nodes), where k is the number of shards per node.
            </Text>
            <br/><br/>
            <ul>
                <li>
                    For instance, if you have 3 data nodes (3 ES instances), you should have 3, 6 or 9 shards.
                </li>
            </ul>
            <blockquote>
                <Text type="warning" italic strong>A shard size of 50GB is often quoted as a limit that has been seen to work for a variety of use-cases.</Text>
            </blockquote>
            <ul>
                <li>
                    if you have 3 data nodes (3 ES instances), and your index size will grow to a maximum of 150GB, you should have 3 shards.
                </li>
            </ul>
        </Paragraph>

      </Form>
    </Modal>
  );
};

export default CreateApp;
