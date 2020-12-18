import React from 'react';
import {Tag} from "antd";


const statusColorMap = {
    ONLINE: "gold",
    OFFLINE: "red",
    HEARTBEAT: "blue",
};

export const WorkerState: React.FC<any> = (props) =>  {
    return (
        <Tag color={statusColorMap[props.state]} key={props.state}>
            {props.state.toUpperCase()}
        </Tag>
    );
};