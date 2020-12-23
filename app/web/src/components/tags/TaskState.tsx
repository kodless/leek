import React from 'react';
import {Tag} from "antd";

const statusColorMap = {
    QUEUED: "cyan",
    RECEIVED: "green",
    STARTED: "geekblue",
    SUCCEEDED: "blue",
    RECOVERED: "purple",
    FAILED: "red",
    REJECTED: "magenta",
    REVOKED: "magenta",
    RETRY: "gold",
};

export const TaskState: React.FC<any> = (props) => {
    let state = props.state;
    let retries = props.retries;
    return (
        <Tag color={statusColorMap[state]} key={state}>
            {retries ? `${state} (${retries})` :state}
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
