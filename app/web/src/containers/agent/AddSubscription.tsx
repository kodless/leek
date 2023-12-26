import React from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Divider,
  Space,
  Select,
  InputNumber,
} from "antd";
import { DeploymentUnitOutlined, NodeIndexOutlined } from "@ant-design/icons";

const FormItem = Form.Item;
const Option = Select.Option;

const AddSubscription = (props) => {
  return (
    <Modal
      title={
        <Space>
          <NodeIndexOutlined />
          Add Subscription
        </Space>
      }
      visible={props.visible}
      onCancel={props.reset}
      footer={[
        <Button key="cancel" size="small" onClick={props.reset}>
          Cancel
        </Button>,
        <Button
          form="addSubscription"
          key="submit"
          htmlType="submit"
          size="small"
          type="primary"
          loading={props.loading}
        >
          Create
        </Button>,
      ]}
    >
      <Form
        onFinish={props.onAdd}
        form={props.form}
        id="addSubscription"
        initialValues={{ type: "RabbitMQ" }}
      >
        <FormItem name="type">
          <Select>
            <Option value="RabbitMQ">RabbitMQ</Option>
            <Option value="Redis">Redis</Option>
            <Option value="SQS" disabled>
              SQS (Not Yet Supported)
            </Option>
          </Select>
        </FormItem>

        <FormItem
          name="broker"
          rules={[{ required: true, message: "Please input broker url!" }]}
        >
          <Input
            prefix={<DeploymentUnitOutlined style={{ fontSize: 13 }} />}
            placeholder="Broker scheme://user:pass@host:port/vhost"
          />
        </FormItem>

        <FormItem
            name="broker_management_url"
            rules={[{ required: true, message: "Please input broker management url!" }]}
        >
          <Input
              prefix={<DeploymentUnitOutlined style={{ fontSize: 13 }} />}
              placeholder="Broker management url scheme://host:port"
          />
        </FormItem>

        <FormItem name="backend" rules={[]}>
          <Input
            prefix={<DeploymentUnitOutlined style={{ fontSize: 13 }} />}
            placeholder="Backend"
          />
        </FormItem>

        <FormItem
          name="app_env"
          rules={[
            {
              required: true,
              message: "Please input environment tag!",
            },
            {
              pattern: /^[a-z]*$/g,
              message: "Wrong env tag, only lowercase letters allowed!",
            },
          ]}
        >
          <Input placeholder="Environment Tag - eg: prod" />
        </FormItem>

        <Divider />

        <FormItem name="exchange" rules={[]}>
          <Input placeholder="Exchange - default: celeryev" />
        </FormItem>

        <FormItem name="queue" rules={[]}>
          <Input placeholder="Queue - default: leek.fanout" />
        </FormItem>

        <FormItem name="routing_key" rules={[]}>
          <Input placeholder="Routing Key - default: #" />
        </FormItem>

        <FormItem
          name="prefetch_count"
          rules={[
            ({ __ }) => ({
              validator(_, value) {
                if (value && (value < 1000 || value > 10000)) {
                  return Promise.reject(
                    new Error("Should be between 1000 and 10000")
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber
            min={1000}
            max={10000}
            step={1}
            placeholder="Prefetch count - default: 1000"
            style={{ width: "100%" }}
          />
        </FormItem>

        <Divider />

        <FormItem name="concurrency_pool_size" rules={[]}>
          <InputNumber
            min={1}
            max={20}
            step={1}
            placeholder="Concurrency pool size - default: 1"
            style={{ width: "100%" }}
          />
        </FormItem>
        {/* Batch */}
        <FormItem
          name="batch_max_size_in_mb"
          rules={[
            ({ __ }) => ({
              validator(_, value) {
                if (value && (value < 1 || value > 10)) {
                  return Promise.reject(
                    new Error("Should be between 1 and 10")
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber
            min={1}
            max={10}
            step={1}
            placeholder="Batch max size in MB - default: 1"
            style={{ width: "100%" }}
          />
        </FormItem>

        <FormItem
          name="batch_max_number_of_messages"
          dependencies={["prefetch_count"]}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value && !getFieldValue("prefetch_count")) {
                  return Promise.resolve();
                }
                if (value && (value < 1000 || value > 10000)) {
                  return Promise.reject(
                    new Error("Should be between 1000 and 10000")
                  );
                }
                if (
                  value &&
                  !getFieldValue("prefetch_count") &&
                  value == 1000
                ) {
                  return Promise.resolve();
                } else if (
                  value &&
                  getFieldValue("prefetch_count") &&
                  value <= getFieldValue("prefetch_count")
                ) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    "Batch max number of messages should be <= prefetch count!"
                  )
                );
              },
            }),
          ]}
        >
          <InputNumber
            min={1000}
            max={10000}
            step={1}
            placeholder="Batch max number of messages - default: 1000"
            style={{ width: "100%" }}
          />
        </FormItem>

        <FormItem
          name="batch_max_window_in_seconds"
          rules={[
            ({ __ }) => ({
              validator(_, value) {
                if (value && (value < 5 || value > 20)) {
                  return Promise.reject(
                    new Error("Should be between 5 and 20")
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber
            min={5}
            max={20}
            step={1}
            placeholder="Batch max window in seconds - default: 5"
            style={{ width: "100%" }}
          />
        </FormItem>
      </Form>
    </Modal>
  );
};

export default AddSubscription;
