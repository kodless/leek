import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import {Card, Col, Row, Empty, Table, Button, Alert, Radio, Checkbox} from "antd";
import { SyncOutlined } from "@ant-design/icons";

import IndexQueueDataColumns from "../components/data/IndexQueueData";
import BrokerQueueDataColumns from "../components/data/BrokerQueueData";
import TimeFilter from "../components/filters/TaskTimeFilter";
import { useApplication } from "../context/ApplicationProvider";
import { QueueService } from "../api/queue";
import { BrokerService } from "../api/broker";
import { handleAPIError, handleAPIResponse } from "../utils/errors";

const QueuesPage = () => {
  const indexQueuesColumns = IndexQueueDataColumns();
  const brokerQueuesColumns = BrokerQueueDataColumns();
  const queueService = new QueueService();
  const brokerService = new BrokerService();
  const [loading, setLoading] = useState<boolean>();
  const [indexQueues, setIndexQueues] = useState<any>([]);
  const [brokerQueues, setBrokerQueues] = useState<any>([]);

  const { currentApp, currentEnv } = useApplication();
  const [pagination, setPagination] = useState<any>({
    pageSize: 10,
    current: 1,
  });
  const [timeFilters, setTimeFilters] = useState<any>({
    timestamp_type: "timestamp",
    interval_type: "past",
    offset: 900000,
  });

  const [statsSource, setStatsSource] = useState<string | null>("INDEX");
  const [hidePIDBoxes, setHidePIDBoxes] = useState<boolean>(true);

  function filterIndexQueues(pager = { current: 1, pageSize: 10 }) {
    if (!currentApp) return;
    setLoading(true);
    queueService
      .filter(currentApp, currentEnv, timeFilters)
      .then(handleAPIResponse)
      .then((result: any) => {
        setIndexQueues(
          result.aggregations.queues.buckets.map(
            ({ key, doc_count, state }) => {
              let tasksStatesSeries = {
                QUEUED: 0,
                RECEIVED: 0,
                STARTED: 0,
                SUCCEEDED: 0,
                FAILED: 0,
                REJECTED: 0,
                REVOKED: 0,
                RETRY: 0,
                RECOVERED: 0,
                CRITICAL: 0,
              };
              const states = state.buckets.reduce((result, item) => {
                result[item.key] = item.doc_count;
                return result;
              }, tasksStatesSeries);
              return {
                queue: key,
                doc_count: doc_count,
                ...states,
              };
            }
          )
        );
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => setLoading(false));
  }

  function filterBrokerQueues() {
    if (!currentApp || !currentEnv) return;
    setLoading(true);
    brokerService
      .getBrokerQueues(currentApp, currentEnv, hidePIDBoxes)
      .then(handleAPIResponse)
      .then((result: any) => {
        setBrokerQueues(result);
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh(pagination);
  }, [currentApp, currentEnv, timeFilters, statsSource, hidePIDBoxes]);

  // UI Callbacks
  function refresh(pager = { current: 1, pageSize: 10 }) {
    if (statsSource == "INDEX") {
      filterIndexQueues(pager);
    }
    else if (statsSource == "BROKER") {
      filterBrokerQueues();
    }
  }

  function handleShowTotal(total) {
    return `Total of ${total} queues`;
  }

  function handleRefresh() {
    refresh(pagination);
  }

  function handleStatsSourceChange(e) {
    setStatsSource(e.target.value);
  }

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Queues</title>
        <meta name="description" content="Broker queues" />
        <meta name="keywords" content="celery, queues" />
      </Helmet>
      {statsSource === "INDEX" && <Row justify="center" style={{ width: "100%", marginTop: 13 }}>
        <Alert
          type="warning"
          showIcon
          closable
          message="For monitoring queues, you should enable task_send_sent_event celery parameter on clients level!"
          action={
            <a
              target="_blank"
              rel="noopener norefferer"
              href="https://tryleek.com/docs/introduction/requirements#enable-celery-task_send_sent_event"
            >
              <Button size="small" type="text">
                Details
              </Button>
            </a>
          }
        />
      </Row>}
      <Row justify="center" style={{ width: "100%", marginTop: 13 }}>
        <Card
          bodyStyle={{ paddingBottom: 0, paddingRight: 0, paddingLeft: 0 }}
          size="small"
          style={{ width: "100%" }}
          title={
            <Row align="middle">
              <Col span={3}>
                <Radio.Group
                  onChange={handleStatsSourceChange}
                  defaultValue="INDEX"
                  size="small"
                  style={{fontWeight: 400}}
                >
                  <Radio.Button value="INDEX" style={{fontStyle: "normal"}}>INDEX</Radio.Button>
                  <Radio.Button value="BROKER">BROKER</Radio.Button>
                </Radio.Group>
              </Col>
              <Col span={18} style={{ textAlign: "center" }}>
                {
                    statsSource === "INDEX" &&
                    <TimeFilter
                      timeFilter={timeFilters}
                      onTimeFilterChange={setTimeFilters}
                    />
                }
              </Col>
              <Col span={3} style={{textAlign: "right"}}>
                {
                  statsSource === "BROKER" &&
                  <Checkbox checked={hidePIDBoxes} onChange={(e) => setHidePIDBoxes(e.target.checked)}>
                    Hide pid boxes
                  </Checkbox>
                }
                <Button
                    size="small"
                    onClick={handleRefresh}
                    icon={<SyncOutlined />}
                />
              </Col>
            </Row>
          }
        >
          <Table
            dataSource={statsSource === "INDEX" ? indexQueues : brokerQueues}
            columns={statsSource === "INDEX" ? indexQueuesColumns : brokerQueuesColumns}
            loading={loading}
            pagination={
              statsSource === "INDEX" ?
                  {...pagination, showTotal: handleShowTotal}
                  :
                  {pageSize: 20, showTotal: handleShowTotal}
            }
            size="small"
            rowKey="name"
            style={{ width: "100%" }}
            scroll={{ x: "100%" }}
            locale={{
              emptyText: (
                <div style={{ textAlign: "center" }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span>
                        No <a href="#API">queues</a> found
                      </span>
                    }
                  />
                </div>
              ),
            }}
          />
        </Card>
      </Row>
    </>
  );
};

export default QueuesPage;
