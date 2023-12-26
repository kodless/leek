import React from "react";
import { Typography, Tag } from "antd";
import {formatBytes, formatNumber} from "../../utils/size";

const Text = Typography.Text;

const filterData = data => formatter => data.map( item => ({
  text: formatter(item),
  value: formatter(item)
}));

function BrokerQueueData(data) {
  return [
    {
      title: "Overview",
      children: [
        {
          title: "Queue",
          dataIndex: "name",
          key: "name",
          render: (name) => {
            return (
                <Text strong style={{ color: "rgb(52, 156, 80)" }}>
                  {name}
                </Text>
            );
          },
          filters: filterData(data)(i => i.name),
          filterSearch: true,
          onFilter: (value: string, record) => record.name && record.name.includes(value),
        },
        {
          title: "State",
          dataIndex: "state",
          key: "state",
          render: (state) => {
            return state === "running" ? <Tag color="green">{state}</Tag> : <Tag color="gray">{state}</Tag>;
          },
        },
        {
          title: "Memory",
          dataIndex: "memory",
          key: "memory",
          render: (memory) => {
            return <Tag color="cyan">{formatBytes(memory, 0)}</Tag>;
          },
        },
        {
          title: "Consumers",
          dataIndex: "consumers",
          key: "consumers",
          render: (consumers) => {
            return <Tag color="cyan">{consumers}</Tag>;
          },
        },
      ]
    },
    {
      title: "Messages",
      children: [
        {
          title: "Ready",
          dataIndex: "messages",
          key: "ready",
          render: (messages) => {
            return <Tag color="green">{formatNumber(messages.ready, 0)}</Tag>;
          },
        },
        {
          title: "Unacked",
          dataIndex: "messages",
          key: "unacked",
          render: (messages) => {
            return <Tag color="purple">{formatNumber(messages.unacknowledged, 0)}</Tag>;
          },
        },
        {
          title: "Total",
          dataIndex: "messages",
          key: "total",
          render: (messages) => {
            return <Tag color="blue">{formatNumber(messages.total, 0)}</Tag>;
          },
        },
      ]
    },
    {
      title: "Rates",
      children: [
        {
          title: "Incoming",
          dataIndex: "rates",
          key: "incoming",
          render: (rates) => {
            return rates.incoming === null ? "-" : <Tag color="red">{rates.incoming}/s</Tag>;
          },
        },
        {
          title: "Deliver/Get",
          dataIndex: "rates",
          key: "deliver_get",
          render: (rates) => {
            return rates.deliver_get === null ? "-" : <Tag color="yellow">{rates.deliver_get}/s</Tag>;
          },
        },
        {
          title: "Ack",
          dataIndex: "rates",
          key: "ack",
          render: (rates) => {
            return rates.ack === null ? "-" : <Tag color="green">{rates.ack}/s</Tag>;
          },
        },
      ]
    }
  ];
}

export default BrokerQueueData;
