import React from 'react';
import {Tag} from "antd";

const statusColorMap = {
    QUEUED: "lime",
    RECEIVED: "blue",
    STARTED: "geekblue",
    SUCCEEDED: "cyan",
    RECOVERED: "green",
    RETRY: "gold",
    FAILED: "magenta",
    CRITICAL: "red",
    REJECTED: "geekblue",
    REVOKED: "purple",
};

export const TaskState: React.FC<any> = (props) => {
    let state = props.state;
    let retries = props.retries;
    let note = props.note;
    let v = note ? `${state} [${note}]` :state;
    v = retries ? `${v} (${retries})` :v;
    return (
        <Tag color={statusColorMap[state]} key={state}>
            {v}
        </Tag>
    );
};

export const TaskStateClosable = (props) => {
    const {value, closable, onClose} = props;
    return (
        <Tag color={statusColorMap[value]} key={value} closable={closable} onClose={onClose} style={{marginRight: 3}}>
            {value}
        </Tag>
    );
};
