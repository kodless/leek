import React, {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet'
import moment from "moment";
import {Row, Col, Statistic, Tooltip, Affix} from 'antd'
import {FieldTimeOutlined, InfoCircleOutlined, EyeInvisibleOutlined} from "@ant-design/icons";


import StickerWidget from "../components/stats/StickerWidget";
import StatsWidgets from "../components/stats/Stats";
import {useApplication} from "../context/ApplicationProvider";
import TimeFilter from "../components/filters/TaskTimeFilter";
import {MetricsService} from "../api/metrics";
import {handleAPIError, handleAPIResponse} from "../utils/errors";

let metricsInterval;
const workerStates = ["HEARTBEAT", "ONLINE", "OFFLINE"];


interface MetricsContextData {
    seenWorkers: {
        key: string;
        doc_count: null;
    }[];
    seenTasks: {
        key: string;
        doc_count: null;
    }[];
    processedEvents: number;
    processedTasks: number;
    seenStates: {
        key: string;
        doc_count: null;
    }[];
    seenTaskStates: {
        key: string;
        doc_count: null;
    }[];
    seenRoutingKeys: {
        key: string;
        doc_count: null;
    }[];
    seenQueues: {
        key: string;
        doc_count: null;
    }[];
}

const tasksStatesDefaults = [
    {key: "QUEUED", doc_count: 0},
    {key: "RECEIVED", doc_count: 0},
    {key: "STARTED", doc_count: 0},
    {key: "SUCCEEDED", doc_count: 0},
    {key: "FAILED", doc_count: 0},
    {key: "REJECTED", doc_count: 0},
    {key: "REVOKED", doc_count: 0},
    {key: "RETRY", doc_count: 0},
    {key: "RECOVERED", doc_count: 0},
    {key: "CRITICAL", doc_count: 0},
];

const IndexPage = () => {
    const {currentApp, currentEnv} = useApplication();
    const [stats, setStats] = useState<any>({});
    const stats_widgets = StatsWidgets(stats);

    // Metadata
    const metricsService = new MetricsService();
    const [seenWorkers, setSeenWorkers] = useState<MetricsContextData["seenWorkers"]>([]);
    const [seenTasks, setSeenTasks] = useState<MetricsContextData["seenTasks"]>([]);
    const [processedEvents, setProcessedEvents] = useState<MetricsContextData["processedEvents"]>(0);
    const [processedTasks, setProcessedTasks] = useState<MetricsContextData["processedTasks"]>(0);
    const [seenStates, setSeenStates] = useState<MetricsContextData["seenStates"]>([]);
    const [seenTaskStates, setSeenTaskStates] = useState<MetricsContextData["seenStates"]>([]);
    const [seenRoutingKeys, setSeenRoutingKeys] = useState<MetricsContextData["seenRoutingKeys"]>([]);
    const [seenQueues, setSeenQueues] = useState<MetricsContextData["seenQueues"]>([]);
    const [searchDriftLoading, setSearchDriftLoading] = useState<boolean>();
    const [searchDrift, setSearchDrift] = useState<any>(null);

    const [timeFilters, setTimeFilters] = useState<any>({
        timestamp_type: "timestamp",
        interval_type: "past",
        offset: 900000
    });

    function getSearchDrift() {
        if (!currentApp || !currentEnv) return;
        setSearchDriftLoading(true);
        metricsService.getSearchDrift(currentApp, currentEnv)
            .then(handleAPIResponse)
            .then((result: any) => {
                setSearchDrift(result);
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => setSearchDriftLoading(false));
    }

    function getMetrics() {
        if (!currentApp) return;
        metricsService.getBasicMetrics(currentApp, currentEnv, timeFilters)
            .then(handleAPIResponse)
            .then((result: any) => {
                setProcessedEvents(result.aggregations.processed_events.value);
                const processed = result.aggregations.seen_states.buckets.reduce((result, item) => {
                    if (!workerStates.includes(item.key)) {
                        return result + item.doc_count;
                    }
                    return result;
                }, 0);
                setProcessedTasks(processed);
                setSeenWorkers(result.aggregations.seen_workers.buckets);
                setSeenTasks(result.aggregations.seen_tasks.buckets);
                setSeenStates(result.aggregations.seen_states.buckets);
                setSeenTaskStates(tasksStatesDefaults
                    .map(obj => result.aggregations.seen_states.buckets
                        .find(o => o.key === obj.key) || obj)
                    .filter(item => !workerStates.includes(item.key))
                );
                setSeenRoutingKeys(result.aggregations.seen_routing_keys.buckets);
                setSeenQueues(result.aggregations.seen_queues.buckets);
            }, handleAPIError)
            .catch(handleAPIError);
    }

    useEffect(() => {
        let adapted = {
            SEEN_TASKS: seenTasks.length,
            SEEN_WORKERS: seenWorkers.length,
            PROCESSED_EVENTS: processedEvents,
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

    useEffect(() => {
        getMetrics();
        return () => {
            clearInterval(metricsInterval);
        }
    }, []);

    useEffect(() => {
        // Stop refreshing metadata
        if (metricsInterval) clearInterval(metricsInterval);
        // If no application specified, return
        if (!currentApp)
            return;

        // Else, get metrics every 10 seconds
        getMetrics();
        getSearchDrift();
        metricsInterval = setInterval(() => {
            getMetrics();
            getSearchDrift();
        }, 10000);
    }, [currentApp, currentEnv, timeFilters]);

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

            <Row justify="space-between" align="middle" style={{marginBottom: 16}}>
                {searchDrift && <Statistic
                    title={<Tooltip title="The time of the latest event processed by leek."><span>Latest Event </span>
                        <InfoCircleOutlined/></Tooltip>}
                    value={searchDrift.latest_event_timestamp ? moment(searchDrift.latest_event_timestamp).format("MMM D HH:mm:ss Z") : "-"}
                    prefix={<FieldTimeOutlined/>}/>}

                <Affix style={{position: 'fixed', left: "50%", transform: "translate(-50%, 0)"}}>
                    <TimeFilter timeFilter={timeFilters} onTimeFilterChange={setTimeFilters}/>
                </Affix>

                {searchDrift && <Statistic
                    title={<Tooltip
                        title="How many events in the queue waiting to be indexed."><span>Current Drift </span>
                        <InfoCircleOutlined/></Tooltip>}
                    value={searchDrift.messages_count ? searchDrift.messages_count : "0"}
                    prefix={<EyeInvisibleOutlined/>}/>}

            </Row>

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
