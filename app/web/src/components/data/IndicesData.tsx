import React from "react";

import { Typography, Tag, Space } from "antd";

const Text = Typography.Text;

function IndicesData() {
  return [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => {
        return (
          <Space direction="horizontal">
            <Text strong>{name}</Text>
          </Space>
        );
      },
    },
    {
      title: "Docs count",
      dataIndex: "docs_count",
      key: "docs_count",
      render: (docs_count) => {
        return <Tag>{docs_count}</Tag>;
      },
    },
    {
      title: "Store size",
      dataIndex: "size",
      key: "size",
      render: (size) => {
        return <Tag>{size}</Tag>;
      },
    },
    {
      title: "Total indexed",
      dataIndex: "index_total",
      key: "index_total",
      render: (index_total) => {
        return <Tag>{index_total}</Tag>;
      },
    },
    {
      title: "Index time",
      dataIndex: "index_time",
      key: "index_time",
      render: (index_time) => {
        return <Tag>{index_time}</Tag>;
      },
    },
  ];
}

export default IndicesData;
