import React from "react";

import { Typography, Tag, Space, Button } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

const Text = Typography.Text;

function SubscriptionData(props) {
  return [
    {
      title: "NAME",
      dataIndex: "name",
      key: "name",
      render: (name) => {
        return <Text strong>{name}</Text>;
      },
    },
    {
      title: "BROKER",
      dataIndex: "broker",
      key: "broker",
      render: (broker) => {
        return <Tag>{broker}</Tag>;
      },
    },
    {
      title: "BACKEND",
      dataIndex: "backend",
      key: "backend",
      render: (backend) => {
        return backend ? <Tag>{backend}</Tag> : <Tag>{"-"}</Tag>;
      },
    },
    {
      title: "ENV",
      dataIndex: "app_env",
      key: "app_env",
      render: (app_env) => {
        return <Tag>{app_env}</Tag>;
      },
    },
    {
      title: "Actions",
      dataIndex: "name",
      key: "name",
      render: (name, record) => {
        return (
          <Space direction="horizontal">
            <Button
              onClick={() => props.handleDeleteSubscription(name)}
              size="small"
              type="primary"
              ghost
              danger
              loading={props.loading}
              icon={<DeleteOutlined />}
            />
          </Space>
        );
      },
    },
  ];
}

export default SubscriptionData;
