import React from "react";

import {
  SyncOutlined,
  RobotFilled,
  RetweetOutlined,
  RollbackOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  SendOutlined,
  UnorderedListOutlined,
  LoadingOutlined,
  BoxPlotOutlined,
  EllipsisOutlined,
  IssuesCloseOutlined,
  WarningOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { STATES_COLORS } from "../../data/states";

function Stats(stats: any) {
  return [
    {
      number: stats.SEEN_TASKS,
      text: "Total Tasks",
      icon: <UnorderedListOutlined />,
      tooltip: "Seen tasks names",
    },
    {
      number: stats.SEEN_WORKERS,
      text: "Total Workers",
      icon: <RobotFilled />,
      tooltip: "The total offline/online and beat workers",
    },
    {
      number: stats.PROCESSED_TASKS_EVENTS,
      text: "Tasks Events Processed",
      icon: <ThunderboltOutlined />,
      tooltip: "The total processed tasks events",
    },
    {
      number: stats.PROCESSED_WORKERS_EVENTS,
      text: "Workers Events Processed",
      icon: <ThunderboltOutlined />,
      tooltip: "The total processed workers events",
    },
    {
      number: stats.PROCESSED_TASKS,
      text: "Tasks Processed",
      icon: <SyncOutlined />,
      tooltip: "The total processed tasks",
    },
    {
      number: stats.SEEN_QUEUES,
      text: "Total Queues",
      icon: <BoxPlotOutlined />,
      tooltip: "Seen queues names",
    },
    {
      number: stats.QUEUED,
      text: "Tasks Queued",
      icon: <EllipsisOutlined />,
      tooltip: "The total tasks in the queues",
    },
    {
      number: stats.RETRY,
      text: "To Retry",
      icon: <RetweetOutlined style={{ color: STATES_COLORS.RETRY }} />,
      tooltip: "Tasks that are failed and waiting for retry",
    },
    {
      number: stats.RECEIVED,
      text: "Received",
      icon: <SendOutlined style={{ color: STATES_COLORS.RECEIVED }} />,
      tooltip: "Tasks were received by a worker. but not yet started",
    },
    {
      number: stats.STARTED,
      text: "Started",
      icon: <LoadingOutlined style={{ color: STATES_COLORS.STARTED }} />,
      tooltip:
        "Tasks that were started by a worker and still active, set (task_track_started) to True on worker level to report started tasks",
    },
    {
      number: stats.SUCCEEDED,
      text: "Succeeded",
      icon: <CheckCircleOutlined style={{ color: STATES_COLORS.SUCCEEDED }} />,
      tooltip: "Tasks that were succeeded",
    },
    {
      number: stats.RECOVERED,
      text: "Recovered",
      icon: <IssuesCloseOutlined style={{ color: STATES_COLORS.RECOVERED }} />,
      tooltip: "Tasks that were succeeded after retries.",
    },
    {
      number: stats.FAILED,
      text: "Failed",
      icon: <WarningOutlined style={{ color: STATES_COLORS.FAILED }} />,
      tooltip: "Tasks that were failed",
    },
    {
      number: stats.CRITICAL,
      text: "Critical",
      icon: <CloseCircleOutlined style={{ color: STATES_COLORS.CRITICAL }} />,
      tooltip: "Tasks that were failed after max retries.",
    },
    {
      number: stats.REJECTED,
      text: "Rejected",
      icon: <RollbackOutlined style={{ color: STATES_COLORS.REJECTED }} />,
      tooltip:
        "Tasks that were rejected by workers and requeued, or moved to a dead letter queue",
    },
    {
      number: stats.REVOKED,
      text: "Revoked",
      icon: <StopOutlined style={{ color: STATES_COLORS.REVOKED }} />,
      tooltip: "Tasks that were revoked by workers, but still in the queue.",
    },
  ];
}

export default Stats;
