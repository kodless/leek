import React from "react";
import { Typography } from "antd";
import TimeAgo from "react-timeago";
import moment from "moment";

const Text = Typography.Text;

export function adaptTime(time) {
  return time ? (
    <>
      {moment(time).format("MMM D HH:mm:ss Z")}{" "}
      <Text style={{ color: "#00BFA6" }}>
        {" "}
        - <TimeAgo date={time} />
      </Text>
    </>
  ) : (
    "-"
  );
}
