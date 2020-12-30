import React, {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet'
import {Card, Col, Row, Empty, Statistic} from 'antd'
import {FilterOutlined} from "@ant-design/icons";
import {LeekPie} from "../components/charts/Pie"
import {LeekBar} from "../components/charts/Bar"
import {LeekWaffle} from "../components/charts/Waffle"
import {LeekLine} from "../components/charts/Line"
import AttributesFilter from "../components/filters/TaskAttributesFilter"
import TimeFilter from "../components/filters/TaskTimeFilter"
import {handleAPIError, handleAPIResponse} from "../utils/errors"
import {MonitorSearch} from "../api/monitor"
import {useApplication} from "../context/ApplicationProvider"
import moment from "moment";

let StatesKeys = [
    "QUEUED",
    "RECEIVED",
    "STARTED",
    "SUCCEEDED",
    "FAILED",
    "REJECTED",
    "REVOKED",
    "RETRY",
];

const MonitorPage = () => {

    const monitorSearch = new MonitorSearch();
    const [totalHits, setTotalHits] = useState<number>(0);
    const [statesDistribution, setStatesDistribution] = useState<any>([]);
    const [queuesDistribution, setQueuesDistribution] = useState<any>([]);
    const [tasksDistribution, setTasksDistribution] = useState<any>([]);
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
                setQueuesDistribution(
                    result.aggregations.queuesDistribution.buckets.map(
                        ({key, doc_count}) => ({id: key, value: doc_count})
                    )
                );
                setTasksDistribution(
                    result.aggregations.tasksDistribution.buckets.map(
                        ({key, statesDistribution, runtimeDistribution}) => {
                            let tasksStatesSeries = {
                                QUEUED: 0,
                                RECEIVED: 0,
                                STARTED: 0,
                                SUCCEEDED: 0,
                                FAILED: 0,
                                REJECTED: 0,
                                REVOKED: 0,
                                RETRY: 0,
                            };
                            const states = statesDistribution.buckets.reduce((result, item) => {
                                result[item.key] = item.doc_count;
                                return result;
                            }, tasksStatesSeries);
                            return {
                                id: key,
                                runtime: runtimeDistribution.value,
                                ...states
                            }
                        }
                    )
                );
                setTasksOverTimeDistribution([
                    {
                        id: "tasks",
                        data: result.aggregations.timeDistribution.buckets.map(
                            ({key, doc_count}) => ({x: moment(key).format("YYYY-MM-DD HH:mm:ss"), y: doc_count})
                        )
                    }
                ]);
                setTotalHits(result.hits.total.value);
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
                    <Row align="middle" style={{textAlign: "center"}} justify="space-between">
                        <Col>
                            <TimeFilter timeFilter={timeFilters} onTimeFilterChange={setTimeFilters}/>
                        </Col>
                        <Col>
                            <Statistic title="Total Filtered" value={totalHits} prefix={<FilterOutlined/>}/>
                        </Col>
                    </Row>
                    <Row justify="center" style={{width: "100%", marginTop: 13}} gutter={10}>
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
                            title="Tasks distribution">
                            <Row style={{height: "400px"}}>
                                <LeekBar data={tasksDistribution} keys={StatesKeys}/>
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
                            title={"Latency distribution - Just success tasks"}>
                            <Row style={{height: "400px"}}>
                                {
                                    filters && filters.state && filters.state === "SUCCEEDED" ?
                                        <LeekBar data={tasksDistribution} keys={["runtime",]}/>
                                        :
                                        <Row align="middle" justify="center" style={{width: "100%"}}>
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description={
                                                    <span>Filter by <a href="#API">SUCCEEDED</a> state to show this chart</span>
                                                }
                                            />
                                        </Row>
                                }
                            </Row>
                        </Card>
                    </Row>
                </Col>
            </Row>
        </>
    )
};

export default MonitorPage
