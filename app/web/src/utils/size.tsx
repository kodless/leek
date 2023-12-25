import React from "react";
import { Tooltip } from "antd";


export function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return <Tooltip title={bytes}>{`${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`}</Tooltip>
}

export function formatNumber(number, decimals = 2) {
    if (!+number) return '0'

    const k = 1000
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['', 'K', 'M', 'B', 'T']

    const i = Math.floor(Math.log(number) / Math.log(k))

    return <Tooltip title={number}>{`${parseFloat((number / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`}</Tooltip>
}
