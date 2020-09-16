import React from "react";
import {Typography} from "antd";
import TimeAgo from 'react-timeago'


const Text = Typography.Text;


export function adaptTime(time) {
    return time ? <>
        {new Date(time * 1000).toString()} <Text style={{color: "#00BFA6"}}>(<TimeAgo
        date={time * 1000}/>)</Text>
    </> : "-"
}
