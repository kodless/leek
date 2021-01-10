import React, {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet'
import {Card, Col, Row, Empty, Statistic} from 'antd'
import {FilterOutlined} from "@ant-design/icons";
import {LeekPie} from "../components/charts/Pie"
import {LeekBar} from "../components/charts/Bar"
import {LeekVerticalBar} from "../components/charts/VerticalBar"
import {LeekWaffle} from "../components/charts/Waffle"
import {LeekLine} from "../components/charts/Line"
import AttributesFilter from "../components/filters/TaskAttributesFilter"
import TimeFilter from "../components/filters/TaskTimeFilter"
import {handleAPIError, handleAPIResponse} from "../utils/errors"
import {MonitorSearch} from "../api/monitor"
import {useApplication} from "../context/ApplicationProvider"
import moment from "moment";
import {TaskState} from "../components/tags/TaskState";

let StatesKeys = [
    "QUEUED",
    "RECEIVED",
    "STARTED",
    "SUCCEEDED",
    "FAILED",
    "REJECTED",
    "REVOKED",
    "RETRY",
    "RECOVERED",
    "CRITICAL",
];

const MonitorPage = () => {

    const monitorSearch = new MonitorSearch();
    const [totalHits, setTotalHits] = useState<number>(0);
    const [statesDistribution, setStatesDistribution] = useState<any>([]);
    const [queuesDistribution, setQueuesDistribution] = useState<any>([]);
    const [topExecutions, setTopExecutions] = useState<any>([]);
    const [topSlow, setTopSlow] = useState<any>([]);
    const [tasksOverTimeDistribution, setTasksOverTimeDistribution] = useState<any>([]);

    // Filters
    const {currentApp, currentEnv} = useApplication();
    const [filters, setFilters] = useState<any>();
    const [timeFilters, setTimeFilters] = useState<any>({
        timestamp_type: "timestamp",
        interval_type: "at",
        offset: 900000,
    });


    function handleFilterChange(values) {
        setFilters(values)
    }

    useEffect(() => {
        if (!currentApp) return;
        let allFilters = {
            ...filters,
            ...timeFilters,
        };
        monitorSearch.charts(currentApp, currentEnv, "desc", allFilters)
            .then(handleAPIResponse)
            .then((result: any) => {
                setStatesDistribution(result.aggregations.statesDistribution.buckets);
                let totalInQueues = 0;
                setQueuesDistribution(
                    result.aggregations.queuesDistribution.buckets.map(
                        ({key, doc_count}) => {
                            totalInQueues += doc_count;
                            return {id: key, label: key, value: doc_count}
                        }
                    )
                );
                let tasksDistribution = result.aggregations.tasksDistribution.buckets.map(
                    ({key, statesDistribution, runtimeDistribution, doc_count}) => {
                        let tasksStatesSeries = {
                            QUEUED: 0,
                            RECEIVED: 0,
                            STARTED: 0,
                            SUCCEEDED: 0,
                            FAILED: 0,
                            REJECTED: 0,
                            REVOKED: 0,
                            RETRY: 0,
                            RECOVERED: 0,
                            CRITICAL: 0,
                        };
                        const states = statesDistribution.buckets.reduce((result, item) => {
                            result[item.key] = item.doc_count;
                            return result;
                        }, tasksStatesSeries);
                        return {
                            id: key,
                            runtime: runtimeDistribution.value,
                            executions: doc_count,
                            ...states
                        }
                    }
                );
                setTopExecutions(tasksDistribution.slice(0, 5));
                setTopSlow([...tasksDistribution].sort(function(a, b) {
                    return b.runtime - a.runtime ;
                }).slice(0, 5).filter(task => {
                    return task.runtime;
                }));
                setTasksOverTimeDistribution([
                    {
                        id: "tasks",
                        data: result.aggregations.timeDistribution.buckets.map(
                            ({key, doc_count}) => ({x: moment(key).format("YYYY-MM-DD HH:mm:ss"), y: doc_count})
                        )
                    }
                ]);
                setTotalHits(totalInQueues);
            }, handleAPIError)
            .catch(handleAPIError);
    }, [currentApp, currentEnv, filters, timeFilters]);

    return (
        <>
            <Helmet
                title="Monitor"
                meta={[
                    {name: 'description', content: 'Tasks monitor'},
                    {name: 'keywords', content: 'celery, tasks'},
                ]}
            >
                <html lang="en"/>
            </Helmet>

            <Row style={{marginBottom: "16px"}} gutter={[12, 12]}>
                <Col xxl={5} xl={6} md={7} lg={8} sm={24} xs={24}>
                    <AttributesFilter
                        onFilter={handleFilterChange}
                    />
                </Col>
                <Col xxl={19} xl={18} md={17} lg={16} sm={24} xs={24}>
                    <Card size="small">
                        <Row align="middle" style={{textAlign: "center"}} justify="space-between">
                            <Col>
                                <TimeFilter timeFilter={timeFilters} onTimeFilterChange={setTimeFilters}/>
                            </Col>
                            <Col>
                                <Statistic title="Total Filtered" value={totalHits} prefix={<FilterOutlined/>}/>
                            </Col>
                        </Row>
                    </Card>
                    <Row style={{width: "100%", marginTop: 13}} gutter={[10, 0]}>
                        <Col span={12}>
                            <Card
                                bodyStyle={{paddingBottom: 0, paddingRight: 0, paddingLeft: 0}}
                                size="small" style={{width: "100%"}}
                                title="States distribution">
                                <Row style={{height: "400px"}}>
                                    <LeekPie data={statesDistribution}/>
                                </Row>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card
                                bodyStyle={{paddingBottom: 0, paddingRight: 0, paddingLeft: 0}}
                                size="small" style={{width: "100%"}}
                                title="Queues distribution">
                                <Row style={{height: "400px"}}>
                                    <LeekWaffle total={totalHits} data={queuesDistribution}/>
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                    <Row justify="center" style={{width: "100%", marginTop: 13}}>
                        <Card
                            bodyStyle={{paddingBottom: 0, paddingRight: 0, paddingLeft: 0}}
                            size="small" style={{width: "100%"}}
                            title="Top 5 Executed Tasks">
                            <Row style={{height: "400px"}}>
                                <LeekBar data={topExecutions} keys={StatesKeys}/>
                            </Row>
                        </Card>
                    </Row>
                    <Row justify="center" style={{width: "100%", marginTop: 13}}>
                        <Card
                            bodyStyle={{paddingBottom: 0, paddingRight: 0, paddingLeft: 0}}
                            size="small" style={{width: "100%"}}
                            title="Tasks over time distribution">
                            <Row style={{height: "400px"}}>
                                <LeekLine data={tasksOverTimeDistribution}/>
                            </Row>
                        </Card>
                    </Row>
                    <Row justify="center" style={{width: "100%", marginTop: 13}}>
                        <Card
                            bodyStyle={{paddingBottom: 0, paddingRight: 0, paddingLeft: 0}}
                            size="small" style={{width: "100%"}}
                            title={<>Top 5 Slow <TaskState state={"SUCCEEDED"}/><TaskState state={"RECOVERED"}/>Tasks</>}
                        >
                            <Row style={{height: "400px"}}>
                                <LeekVerticalBar data={topSlow} keys={["runtime",]} color="yellow_orange_red"/>
                            </Row>
                        </Card>
                    </Row>
                </Col>
            </Row>
        </>
    )
};

export default MonitorPage
