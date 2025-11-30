import React from "react";

import {Typography, Tag, Space, Button} from "antd";
import {adaptTime} from "../../utils/date";
import {ReloadOutlined} from "@ant-design/icons";

const Text = Typography.Text;

function TransformsData(props) {
  return [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (id) => {
        return (
          <Space direction="horizontal">
            <Text strong>{id}</Text>
          </Space>
        );
      },
    },
    {
      title: "Enabled",
      dataIndex: "enabled",
      key: "enabled",
      render: (enabled) => {
        return enabled ? <Tag color="green">Enabled</Tag> : <Tag color="red">Disabled</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: "Processed",
      dataIndex: "documents_processed",
      key: "documents_processed",
      render: (documents_processed) => {
        return <Tag color="orange">{documents_processed}</Tag>;
      },
    },
    {
      title: "Indexed",
      dataIndex: "documents_indexed",
      key: "documents_indexed",
      render: (documents_indexed) => {
        return <Tag color="cyan">{documents_indexed}</Tag>;
      },
    },
    {
      title: "Enabled time",
      dataIndex: "enabled_at",
      key: "enabled_at",
      render: (enabled_at) => {
        return <Tag>{adaptTime(enabled_at)}</Tag>;
      },
    },
    {
      title: "Checkpoint",
      dataIndex: "last_timestamp",
      key: "last_timestamp",
      render: (last_timestamp) => {
        return <Tag>{adaptTime(last_timestamp)}</Tag>;
      },
    },
    {
      title: "Failure",
      dataIndex: "failure",
      key: "failure",
      render: (failure) => {
        return (
            <Text strong>{failure}</Text>
        );
      },
    },
    {
      title: "Actions",
      dataIndex: "id",
      key: "id",
      render: (id, record) => {
        return (
            <Space direction="horizontal">
              <Button
                  onClick={() => props.handleStartTransform(id)}
                  size="small"
                  type="primary"
                  loading={props.loading}
                  icon={<ReloadOutlined />}
              />
            </Space>
        );
      },
    },
  ];
}

export default TransformsData;
