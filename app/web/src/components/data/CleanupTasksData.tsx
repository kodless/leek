import React from "react";

import { Typography, Tag, Space } from "antd";
import {adaptTime} from "../../utils/date";

const Text = Typography.Text;

function CleanupTasksData() {
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
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => {
        return <Tag color="orange">{total}</Tag>;
      },
    },
    {
      title: "Deleted",
      dataIndex: "deleted",
      key: "deleted",
      render: (deleted) => {
        return <Tag color="red">{deleted}</Tag>;
      },
    },
    {
      title: "Start time",
      dataIndex: "start_time",
      key: "start_time",
      render: (start_time) => {
        return <Tag>{adaptTime(start_time)}</Tag>;
      },
    },
    {
      title: "Running time (min)",
      dataIndex: "running_time",
      key: "running_time",
      render: (running_time) => {
        return <Tag>{running_time/60000000000}</Tag>;
      },
    },
  ];
}

export default CleanupTasksData;
