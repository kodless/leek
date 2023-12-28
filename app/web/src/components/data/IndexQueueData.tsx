import React from "react";
import { Typography, Tag } from "antd";
import {formatNumber} from "../../utils/size";

const Text = Typography.Text;

const filterData = data => formatter => data.map( item => ({
  text: formatter(item),
  value: formatter(item)
}));

function IndexQueueData(data) {
  return [
    {
      title: "Queue",
      dataIndex: "queue",
      key: "queue",
      render: (queue) => {
        return (
          <Text strong style={{ color: "rgb(52, 156, 80)" }}>
            {queue}
          </Text>
        );
      },
      filters: filterData(data)(i => i.queue),
      filterSearch: true,
      onFilter: (value: string, record) => record.queue && record.queue.includes(value),
    },
    {
      title: "Messages",
      dataIndex: "doc_count",
      key: "doc_count",
      render: (doc_count) => {
        return <Tag>{formatNumber(doc_count, 0)}</Tag>;
      },
      defaultSortOrder: "descend",
      sorter: (a, b) => a.doc_count - b.doc_count,
    },
    {
      title: "Queued",
      dataIndex: "QUEUED",
      key: "QUEUED",
      render: (QUEUED) => {
        return <Tag color="blue">{formatNumber(QUEUED, 0)}</Tag>;
      },
      sorter: (a, b) => a.QUEUED - b.QUEUED,
    },
    {
      title: "Received",
      dataIndex: "RECEIVED",
      key: "RECEIVED",
      render: (RECEIVED) => {
        return <Tag color="blue">{formatNumber(RECEIVED, 0)}</Tag>;
      },
      sorter: (a, b) => a.RECEIVED - b.RECEIVED,
    },
    {
      title: "Started",
      dataIndex: "STARTED",
      key: "STARTED",
      render: (STARTED) => {
        return <Tag color="blue">{formatNumber(STARTED, 0)}</Tag>;
      },
      sorter: (a, b) => a.STARTED - b.STARTED,
    },
    {
      title: "Succeeded",
      dataIndex: "SUCCEEDED",
      key: "SUCCEEDED",
      render: (SUCCEEDED) => {
        return <Tag color="green">{formatNumber(SUCCEEDED, 0)}</Tag>;
      },
      sorter: (a, b) => a.SUCCEEDED - b.SUCCEEDED,
    },
    {
      title: "Recovered",
      dataIndex: "RECOVERED",
      key: "RECOVERED",
      render: (RECOVERED) => {
        return <Tag color="green">{formatNumber(RECOVERED, 0)}</Tag>;
      },
      sorter: (a, b) => a.RECOVERED - b.RECOVERED,
    },
    {
      title: "Retry",
      dataIndex: "RETRY",
      key: "RETRY",
      render: (RETRY) => {
        return <Tag color="orange">{formatNumber(RETRY, 0)}</Tag>;
      },
      sorter: (a, b) => a.RETRY - b.RETRY,
    },
    {
      title: "Failed",
      dataIndex: "FAILED",
      key: "FAILED",
      render: (FAILED) => {
        return <Tag color="red">{formatNumber(FAILED, 0)}</Tag>;
      },
      sorter: (a, b) => a.FAILED - b.FAILED,
    },
    {
      title: "Critical",
      dataIndex: "CRITICAL",
      key: "CRITICAL",
      render: (CRITICAL) => {
        return <Tag color="red">{formatNumber(CRITICAL, 0)}</Tag>;
      },
      sorter: (a, b) => a.CRITICAL - b.CRITICAL,
    },
    {
      title: "Revoked",
      dataIndex: "REVOKED",
      key: "REVOKED",
      render: (REVOKED) => {
        return <Tag color="purple">{formatNumber(REVOKED, 0)}</Tag>;
      },
      sorter: (a, b) => a.REVOKED - b.REVOKED,
    },
  ];
}

export default IndexQueueData;
