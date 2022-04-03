import React from "react";
import { Tag } from "antd";

const statusColorMap = {
  STARTING: "blue",
  RUNNING: "cyan",
  STOPPING: "gold",
  STOPPED: "red",
  FATAL: "red",
  EXITED: "red",
  BACKOFF: "magenta",
};

export const AgentState: React.FC<any> = (props) => {
  return (
    <Tag color={statusColorMap[props.state]} key={props.state}>
      {props.state}
    </Tag>
  );
};
