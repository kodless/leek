import React from "react";

import {
    SyncOutlined, RobotFilled, RetweetOutlined, RollbackOutlined, CheckCircleOutlined, CloseCircleOutlined,
    StopOutlined, SendOutlined, UnorderedListOutlined, LoadingOutlined, ExclamationCircleOutlined, EllipsisOutlined
} from '@ant-design/icons';


function Stats(stats: any) {
    return [
        {
            number: stats.SEEN_TASKS,
            text: 'Total Tasks',
            icon: <UnorderedListOutlined/>,
            tooltip: 'Seen tasks names'
        },
        {
            number: stats.SEEN_WORKERS,
            text: 'Total Workers',
            icon: <RobotFilled/>,
            tooltip: 'The total offline/online and beat workers'
        },
        {
            number: stats.QUEUED,
            text: 'Tasks Queued',
            icon: <EllipsisOutlined/>,
            tooltip: 'The total tasks in the queues'
        },
        {
            number: stats.PROCESSED_TASKS,
            text: 'Tasks Processed',
            icon: <SyncOutlined/>,
            tooltip: 'The total processed tasks'
        },
        {
            number: stats.RECEIVED,
            text: 'Received',
            icon: <SendOutlined style={{color: "#42A5F6"}}/>,
            tooltip: 'Tasks were received by a worker. but not yet started'
        },
        {
            number: stats.IGNORED,
            text: 'Ignored',
            icon: <ExclamationCircleOutlined style={{color: "#FF5626"}}/>,
            tooltip: 'Tasks that were ignored due to expiration'
        },
        {
            number: stats.STARTED,
            text: 'Active',
            icon: <LoadingOutlined style={{color: "#536DFE"}}/>,
            tooltip: 'Tasks that were started by a worker and still active, set (task_track_started) to True on worker level to report started tasks'
        },
        {
            number: stats.SUCCEEDED,
            text: 'Succeeded',
            icon: <CheckCircleOutlined style={{color: "#00BFA6"}}/>,
            tooltip: 'Tasks that were succeeded'
        },
        {
            number: stats.RETRY,
            text: 'Retried',
            icon: <RetweetOutlined style={{color: "#007B9E"}}/>,
            tooltip: 'Tasks that are failed and waiting for retry'
        },
        {
            number: stats.FAILED,
            text: 'Failed',
            icon: <CloseCircleOutlined style={{color: "#F50057"}}/>,
            tooltip: 'Tasks that were failed'
        },
        {
            number: stats.REVOKED,
            text: 'Revoked',
            icon: <StopOutlined style={{color: "#7266BA"}}/>,
            tooltip: 'Tasks that were revoked by workers, but still in the queue.'
        },
        {
            number: stats.REJECTED,
            text: 'Rejected',
            icon: <RollbackOutlined style={{color: "#F9A826"}}/>,
            tooltip: 'Tasks that were rejected by workers and requeued, or moved to a dead letter queue'
        },
    ];
}


export default Stats;