import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import moment from "moment";
import { Row, Col, Statistic, Tooltip, Affix } from "antd";
import {
  FieldTimeOutlined,
  InfoCircleOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";

import StickerWidget from "../components/stats/StickerWidget";
import StatsWidgets from "../components/stats/Stats";
import { useApplication } from "../context/ApplicationProvider";
import TimeFilter from "../components/filters/TaskTimeFilter";
import { MetricsService } from "../api/metrics";
import { BrokerService } from "../api/broker";
import { handleAPIError, handleAPIResponse } from "../utils/errors";
import {formatNumber} from "../utils/size";

let metricsInterval;
const workerStates = ["HEARTBEAT", "ONLINE", "OFFLINE"];

interface MetricsContextData {
  seenWorkers: {
    key: string;
    doc_count: null;
  }[];
  seenTasks: {
    key: string;
    doc_count: null;
  }[];
  processedEvents: number;
  processedTasks: number;
  seenStates: {
    key: string;
    doc_count: null;
  }[];
  seenTaskStates: {
    key: string;
    doc_count: null;
  }[];
  seenRoutingKeys: {
    key: string;
    doc_count: null;
  }[];
  seenQueues: {
    key: string;
    doc_count: null;
  }[];
}

const tasksStatesDefaults = [
  { key: "QUEUED", doc_count: 0 },
  { key: "RECEIVED", doc_count: 0 },
  { key: "STARTED", doc_count: 0 },
  { key: "SUCCEEDED", doc_count: 0 },
  { key: "FAILED", doc_count: 0 },
  { key: "REJECTED", doc_count: 0 },
  { key: "REVOKED", doc_count: 0 },
  { key: "RETRY", doc_count: 0 },
  { key: "RECOVERED", doc_count: 0 },
  { key: "CRITICAL", doc_count: 0 },
];

const IndexPage = () => {
  const { currentApp, currentEnv } = useApplication();
  const [stats, setStats] = useState<any>({});
  const stats_widgets = StatsWidgets(stats);

  // Metadata
  const metricsService = new MetricsService();
  const brokerService = new BrokerService();
  const [seenWorkers, setSeenWorkers] = useState<
    MetricsContextData["seenWorkers"]
  >([]);
  const [seenTasks, setSeenTasks] = useState<MetricsContextData["seenTasks"]>(
    []
  );
  const [processedTasksEvents, setProcessedTasksEvents] =
    useState<MetricsContextData["processedTasksEvents"]>(0);
  const [processedWorkersEvents, setProcessedWorkersEvents] =
      useState<MetricsContextData["processedWorkersEvents"]>(0);
  const [processedTasks, setProcessedTasks] =
    useState<MetricsContextData["processedTasks"]>(0);
  const [seenStates, setSeenStates] = useState<
    MetricsContextData["seenStates"]
  >([]);
  const [seenTaskStates, setSeenTaskStates] = useState<
    MetricsContextData["seenStates"]
  >([]);
  const [seenRoutingKeys, setSeenRoutingKeys] = useState<
    MetricsContextData["seenRoutingKeys"]
  >([]);
  const [seenQueues, setSeenQueues] = useState<
    MetricsContextData["seenQueues"]
  >([]);
  const [brokerDriftLoading, setBrokerDriftLoading] = useState<boolean>(true);
  const [brokerDrift, setBrokerDrift] = useState<any>(null);

  const [timeFilters, setTimeFilters] = useState<any>({
    timestamp_type: "timestamp",
    interval_type: "past",
    offset: 900000,
  });

  function getBrokerDrift() {
    if (!currentApp || !currentEnv) return;
    setBrokerDriftLoading(true);
    brokerService
      .getBrokerDrift(currentApp, currentEnv)
      .then(handleAPIResponse)
      .then((result: any) => {
        setBrokerDrift(result);
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => setBrokerDriftLoading(false));
  }

  function getMetrics() {
    if (!currentApp) return;
    metricsService
      .getBasicMetrics(currentApp, currentEnv, timeFilters)
      .then(handleAPIResponse)
      .then((result: any) => {
        result.aggregations.events.buckets.map((item) => {
          if (item.key=="task") return setProcessedTasksEvents(item.processed.value);
          if (item.key=="worker") return setProcessedWorkersEvents(item.processed.value);
        })
        ;
        const processed = result.aggregations.seen_states.buckets.reduce(
          (result, item) => {
            if (!workerStates.includes(item.key)) {
              return result + item.doc_count;
            }
            return result;
          },
          0
        );
        setProcessedTasks(processed);
        setSeenWorkers(result.aggregations.seen_workers.buckets);
        setSeenTasks(result.aggregations.seen_tasks.buckets);
        setSeenStates(result.aggregations.seen_states.buckets);
        setSeenTaskStates(
          tasksStatesDefaults
            .map(
              (obj) =>
                result.aggregations.seen_states.buckets.find(
                  (o) => o.key === obj.key
                ) || obj
            )
            .filter((item) => !workerStates.includes(item.key))
        );
        setSeenRoutingKeys(result.aggregations.seen_routing_keys.buckets);
        setSeenQueues(result.aggregations.seen_queues.buckets);
      }, handleAPIError)
      .catch(handleAPIError);
  }

  useEffect(() => {
    let adapted = {
      SEEN_TASKS: seenTasks.length,
      SEEN_WORKERS: seenWorkers.length,
      PROCESSED_TASKS_EVENTS: processedTasksEvents,
      PROCESSED_WORKERS_EVENTS: processedWorkersEvents,
      PROCESSED_TASKS: processedTasks,
      SEEN_QUEUES: seenQueues.length,
      TASKS: 0,
      EVENTS: 0,
      // Tasks
      QUEUED: 0,
      RECEIVED: 0,
      STARTED: 0,
      SUCCEEDED: 0,
      FAILED: 0,
      REJECTED: 0,
      REVOKED: 0,
      IGNORED: 0,
      RETRY: 0,
      RECOVERED: 0,
      CRITICAL: 0,
      // Worker
      ONLINE: 0,
      HEARTBEAT: 0,
      OFFLINE: 0,
    };
    seenStates.map((task, _) => (adapted[task.key] = task.doc_count));
    setStats(adapted);
  }, [seenTasks, seenWorkers, seenStates]);

  useEffect(() => {
    getMetrics();
    getBrokerDrift();
    return () => {
      clearInterval(metricsInterval);
    };
  }, []);

  useEffect(() => {
    // Stop refreshing metadata
    if (metricsInterval) clearInterval(metricsInterval);
    // If no application specified, return
    if (!currentApp) return;

    // Else, get metrics every 10 seconds
    getMetrics();
    getBrokerDrift();
    metricsInterval = setInterval(() => {
      getMetrics();
      getBrokerDrift();
    }, 10000);
  }, [currentApp, currentEnv, timeFilters]);

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Metrics</title>
        <meta name="description" content="Events metrics" />
        <meta name="keywords" content="celery, tasks" />
      </Helmet>

      <Row justify="space-between" align="middle">
        <Col
            lg={{span: 8, order:1}}
            md={{span: 12, order:2}}
            sm={{span: 12, order:2}}
            xs={{span: 12, order:2}}
            style={{ marginBottom: 16 }}
        >
          <Statistic
            loading={brokerDriftLoading}
            title={
              <Tooltip title="The time of the latest event processed by leek.">
                <span>Latest Event </span>
                <InfoCircleOutlined />
              </Tooltip>
            }
            value={
              brokerDrift && brokerDrift.latest_event_timestamp
                ? moment(brokerDrift.latest_event_timestamp).format(
                    "MMM D HH:mm:ss Z"
                  )
                : ""
            }
            valueStyle={{ fontSize: 17.5 }}
            prefix={<FieldTimeOutlined />}
          />
        </Col>

        <Col
            lg={{span: 8, order:2}}
            md={{span: 24, order:1}}
            sm={{span: 24, order:1}}
            xs={{span: 24, order:1}}
            style={{ marginBottom: 16, textAlign: "center" }}
        >
          <TimeFilter
              timeFilter={timeFilters}
              onTimeFilterChange={setTimeFilters}
          />
        </Col>

        <Col
            lg={{span: 8, order:3}}
            md={{span: 12, order:3}}
            sm={{span: 12, order:3}}
            xs={{span: 12, order:3}}
            style={{ marginBottom: 16 }}
        >
        <Statistic
          style={{ float: "right" }}
          loading={brokerDriftLoading}
          title={
            <Tooltip title="Unacknowledged fanout queue events being processed by Leek agents / total fanout queue events.">
              <span>Current Drift (processing/total) </span>
              <InfoCircleOutlined />
            </Tooltip>
          }
          value={
            brokerDrift && brokerDrift.messages
              ? brokerDrift.messages.unacked
              : 0
          }
          suffix={
            brokerDrift && brokerDrift.messages
                ? <><span>/ </span>{formatNumber(brokerDrift.messages.total, 1)}</>
                : "/ 0"
          }
          valueStyle={{ fontSize: 17.5 }}
          prefix={<EyeInvisibleOutlined />}
        /></Col>
      </Row>

      <Row gutter={16} justify="center" align="middle">
        {stats_widgets.map((widget, idx) => (
          <Col
            lg={12}
            md={12}
            sm={12}
            xs={24}
            key={idx}
            style={{ marginBottom: "16px" }}
          >
            <StickerWidget
              number={widget.number}
              text={widget.text}
              icon={widget.icon}
              tooltip={widget.tooltip}

            />
          </Col>
        ))}
      </Row>
    </>
  );
};

export default IndexPage;
