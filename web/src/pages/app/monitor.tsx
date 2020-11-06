import React, {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet'
import _ from 'lodash';
import {Card, Col, DatePicker, Row, Select, Input} from 'antd'
import {LeekPie} from "../../components/monitor/Pie";
import {LeekBar} from "../../components/monitor/Bar";
import {LeekWaffle} from "../../components/monitor/Waffle";
import Filter from "../../containers/tasks/TaskFilter";
import {handleAPIError, handleAPIResponse} from "../../utils/errors";
import {MonitorSearch} from "../../api/monitor";
import {useApplication} from "../../context/ApplicationProvider";
import moment from "moment";

const {Option} = Select;
const {RangePicker} = DatePicker;
const tasksStatesSeries = {
    SENT: 0,
    RECEIVED: 0,
    STARTED: 0,
    SUCCEEDED: 0,
    FAILED: 0,
    REJECTED: 0,
    REVOKED: 0,
    RETRY: 0,
};

const MonitorPage = () => {

    const monitorSearch = new MonitorSearch();
    const [totalHits, setTotalHits] = useState<number>(0);
    const [statesDistribution, setStatesDistribution] = useState<any>([]);
    const [tasksDistribution, setTasksDistribution] = useState<any>([]);
    const [routingKeysDistribution, setRoutingKeysDistribution] = useState<any>([]);

    // Filters
    const {currentApp, currentEnv} = useApplication();
    const [filters, setFilters] = useState<any>();
    const [timeFilters, setTimeFilters] = useState<any>({
        timestamp_type: "timestamp",
        interval_type: "at",
        past_time: 900
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
                setRoutingKeysDistribution(
                    result.aggregations.routingKeysDistribution.buckets.map(
                        ({key, doc_count}) => ({id: key, value: doc_count})
                    )
                );
                setTasksDistribution(
                    result.aggregations.tasksDistribution.buckets.map(
                        ({key, statesDistribution}) => (
                            {
                                task: key,
                                ...statesDistribution.buckets.reduce((obj, item) => _.extend((obj[item.key] = item.doc_count, obj), tasksStatesSeries), tasksStatesSeries)
                            }
                        )
                    )
                );
                setTotalHits(result.hits.total.value);
            }, handleAPIError)
            .catch(handleAPIError);
    }, [currentApp, currentEnv, filters, timeFilters]);


    function handleTimeRangeChange(dates, dateStrings) {
        // The dates are converted to UTC unix timestamps because dates are indexed as such
        let filters = {...timeFilters};
        if (dateStrings[0])
            filters.after_time = moment(dateStrings[0]).unix();
        else
            filters.after_time = 0;

        if (dateStrings[1])
            filters.before_time = moment(dateStrings[1]).unix();
        else
            filters.before_time = 0;

        setTimeFilters(filters);
    }

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
                    <Filter
                        onFilter={handleFilterChange}
                    />
                </Col>
                <Col xxl={19} xl={18} md={17} lg={16} sm={24} xs={24}>
                    <Row align="middle" style={{textAlign: "center"}}>
                        <Input.Group compact>
                            <Select defaultValue="timestamp"
                                    dropdownMatchSelectWidth
                                    style={{width: 115}}
                                    size="small"
                                    onChange={type => setTimeFilters({
                                        ...timeFilters,
                                        timestamp_type: type
                                    })}
                            >
                                <Option value="timestamp">Seen</Option>
                                <Option value="sent_at">Sent</Option>
                                <Option value="received_at">Received</Option>
                                <Option value="started_at">Started</Option>
                                <Option value="succeeded_at">Succeeded</Option>
                                <Option value="failed_at">Failed</Option>
                                <Option value="retried_at">Retried</Option>
                                <Option value="rejected_at">Rejected</Option>
                                <Option value="revoked_at">Revoked</Option>
                            </Select>
                            <Select defaultValue="at"
                                    dropdownMatchSelectWidth
                                    style={{width: 70}}
                                    size="small"
                                    onChange={type => setTimeFilters({
                                        ...timeFilters,
                                        interval_type: type
                                    })}
                            >
                                <Option value="at">at</Option>
                                <Option value="past">past</Option>
                            </Select>
                            {timeFilters.interval_type == "at" ?
                                <RangePicker
                                    showTime
                                    allowEmpty={[true, true]}
                                    onChange={handleTimeRangeChange}
                                    size="small"/>
                                :
                                <Select defaultValue="900"
                                        dropdownMatchSelectWidth
                                        style={{width: 120}}
                                        size="small"
                                        onChange={past => setTimeFilters({
                                            ...timeFilters,
                                            past_time: parseInt(past)
                                        })}
                                >
                                    <Option value="900">15 minutes</Option>
                                    <Option value="1800">30 minutes</Option>
                                    <Option value="3600">1 Hour</Option>
                                    <Option value="14400">4 Hours</Option>
                                    <Option value="86400">1 day</Option>
                                    <Option value="172800">2 days</Option>
                                </Select>
                            }
                        </Input.Group>
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
                                title="Routing keys distribution">
                                <Row style={{height: "400px"}}>
                                    <LeekWaffle total={totalHits} data={routingKeysDistribution}/>
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
                                <LeekBar data={tasksDistribution}/>
                            </Row>
                        </Card>
                    </Row>
                </Col>
            </Row>
        </>
    )
};

export default MonitorPage
