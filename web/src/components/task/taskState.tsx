import React from 'react';
import {Tag} from "antd";

const statusColorMap = {
    SENT: "cyan",
    RECEIVED: "lime",
    STARTED: "geekblue",
    SUCCEEDED: "blue",
    FAILED: "red",
    REJECTED: "red",
    REVOKED: "red",
    RETRY: "gold",
};

export const TaskState: React.FC<any> = (props) => {
    let state = props.state;
    return (
        <Tag color={statusColorMap[state]} key={state}>
            {state.toUpperCase()}
        </Tag>
    );
};

export const TaskStateClosable = (props) => {
    const {value, closable, onClose} = props;
    return (
        <Tag color={statusColorMap[value]} key={value} closable={closable} onClose={onClose} style={{marginRight: 3}}>
            {value.toUpperCase()}
        </Tag>
    );
};
