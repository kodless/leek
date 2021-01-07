import React, {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet'
import {Row, Col} from 'antd'


import StickerWidget from "../components/stats/StickerWidget";
import StatsWidgets from "../components/stats/Stats";
import {useApplication} from "../context/ApplicationProvider";

const IndexPage = () => {
    const {seenTasks, seenWorkers, seenStates, processedTasks} = useApplication();
    const [stats, setStats] = useState<any>({});
    const stats_widgets = StatsWidgets(stats);

    useEffect(() => {
        let adapted = {
            SEEN_TASKS: seenTasks.length,
            SEEN_WORKERS: seenWorkers.length,
            PROCESSED_TASKS: processedTasks,
            TASKS: 0,
            EVENTS: 0,
            // Tasks
            QUEUED: 0,
            RECEIVED: 0,
            STARTED: 0,
            SUCCEEDED: 0,
            FAILED: 0,
            REJECTED: 0,
            REVOKED: 0,
            IGNORED: 0,
            RETRY: 0,
            RECOVERED: 0,
            CRITICAL: 0,
            // Worker
            ONLINE: 0,
            HEARTBEAT: 0,
            OFFLINE: 0,
        };
        seenStates.map((task, _) =>
            adapted[task.key] = task.doc_count
        );
        setStats(adapted)
    }, [seenTasks, seenWorkers, seenStates]);

    return (
        <>
            <Helmet
                title="Metrics"
                meta={[
                    {name: 'description', content: 'Events metrics'},
                    {name: 'keywords', content: 'celery, tasks'},
                ]}
            >
                <html lang="en"/>
            </Helmet>

            <Row gutter={16} justify="center" align="middle">
                {stats_widgets.map((widget, idx) => (
                    <Col lg={12} md={12} sm={12} xs={24} key={idx} style={{marginBottom: "16px"}}>
                        <StickerWidget
                            number={widget.number}
                            text={widget.text}
                            icon={widget.icon}
                            tooltip={widget.tooltip}
                        />
                    </Col>
                ))}
            </Row>
        </>
    )
};

export default IndexPage
