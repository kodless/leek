import React from "react";
import TimeAgo from "react-timeago";

import { Typography, Space, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import moment from "moment";

const Text = Typography.Text;

function AdminData(props) {
  return [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => {
        return <Text strong style={{ color: "gold" }}>
          {email}
        </Text>;
      },
    },
    {
      title: "Since",
      dataIndex: "since",
      key: "since",
      render: (since) => {
        return <Text style={{ color: "rgba(45,137,183,0.8)" }} strong>
          {since ? moment(since).format("MMM D HH:mm:ss Z") : "-"} -{" "}
          <Text>{since ? <TimeAgo date={since} /> : "-"}</Text>
        </Text>
      },
    },
    {
      title: "Actions",
      dataIndex: "email",
      key: "email",
      render: (email) => {
        return (
          <Space direction="horizontal" style={{ float: "right" }}>
            <Button
              onClick={() => props.handleDeleteAdmin(email)}
              size="small"
              type="primary"
              ghost
              danger
              loading={props.adminsModifying}
              icon={<DeleteOutlined />}
            />
          </Space>
        );
      },
    },
  ];
}

export default AdminData;
