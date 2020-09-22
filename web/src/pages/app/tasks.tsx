import React, {useState, useEffect} from "react";
import {Helmet} from 'react-helmet'
import moment from "moment";
import {useQueryParam, StringParam} from "use-query-params";
import {Row, Drawer, message, Col, Table, DatePicker, Button, Switch, Card, Empty, Select, Input} from 'antd'
import {SyncOutlined, CaretUpOutlined, CaretDownOutlined} from '@ant-design/icons';

import TaskDataColumns from "../../components/task/TaskData"
import TaskDetailsDrawer from '../../containers/tasks/TaskDetailsDrawer'
import Filter from '../../containers/tasks/TaskFilter';

import {useApplication} from "../../context/ApplicationProvider";
import {TaskSearch} from "../../api/task";
import {handleAPIError, handleAPIResponse} from "../../utils/errors";

const {Option} = Select;
const {RangePicker} = DatePicker;

const TasksPage: React.FC = () => {
    // STATE
    const taskSearch = new TaskSearch();
    const {currentApp, currentEnv} = useApplication();
    const [qpTaskUUID, setQPTaskUUID] = useQueryParam("uuid", StringParam);

    // Filters
    const [filters, setFilters] = useState<any>();
    const [timeFilters, setTimeFilters] = useState<any>({
        timestamp_type: "timestamp",
        interval_type: "at",
        past_time: 900
    });
    const [order, setOrder] = useState<string>("desc");

    // Data
    const columns = TaskDataColumns();
    const [pagination, setPagination] = useState<any>({pageSize: 10, current: 1});
    const [loading, setLoading] = useState<boolean>();
    const [tasks, setTasks] = useState<any[]>([]);
    const [currentTask, setCurrentTask] = useState({});

    // UI
    const [taskDetailsVisible, setDetailsVisible] = useState(false);

    // API Calls
    function filterTasks(pager = {current: 1, pageSize: 10}) {
        if (!currentApp) return;
        setLoading(true);
        let allFilters = {
            ...filters,
            ...timeFilters,
        };
        let from_ = (pager.current - 1) * pager.pageSize;
        taskSearch.filter(currentApp, currentEnv, pager.pageSize, from_, order, allFilters)
            .then(handleAPIResponse)
            .then((result: any) => {
                // Pagination
                const p = {
                    pageSize: pager.pageSize,
                    current: pager.current,
                    total: result.hits.total.value
                };
                setPagination(p);
                // Result
                let tasksList: { any }[] = [];
                result.hits.hits.forEach(function (hit) {
                    tasksList.push(hit._source)
                });
                setTasks(tasksList);
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => setLoading(false));
    }

    function getTaskByUUID(uuid: string) {
        if (!currentApp) return;
        taskSearch.getById(currentApp, uuid)
            .then(handleAPIResponse)
            .then((result: any) => {
                if (result.hits.total == 0) {
                    message.warning("Task not found, maybe its very old");
                    return;
                }
                handleShowTaskDetails(result.hits.hits[0]._source);
            }, handleAPIError)
            .catch(handleAPIError);
    }

    // Hooks
    useEffect(() => {
        refresh(pagination)
    }, [currentApp, currentEnv, filters, timeFilters, order]);

    useEffect(() => {
        if (qpTaskUUID) {
            getTaskByUUID(qpTaskUUID)
        }
    }, []);


    // UI Callbacks
    function refresh(pager = {current: 1, pageSize: 10}) {
        setTasks([]);
        filterTasks(pager)
    }

    function handleHideTaskDetails() {
        setDetailsVisible(false);
        setQPTaskUUID(undefined)
    }

    function handleShowTaskDetails(record) {
        setCurrentTask(record);
        setQPTaskUUID(record.uuid);
        setDetailsVisible(true)
    }

    function handleRefresh() {
        refresh(pagination)
    }

    function handleShowTotal(total) {
        return `Total of ${total} tasks`;
    }

    function handleTableChange(pagination, filters, sorter) {
        refresh(pagination)
    }

    function handleFilterChange(values) {
        setFilters(values)
    }

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
                title="Tasks"
                meta={[
                    {name: 'description', content: 'List of tasks'},
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
                    <Row justify="center" style={{width: "100%"}}>
                        <Card
                            bodyStyle={{paddingBottom: 0, paddingRight: 0, paddingLeft: 0}}
                            title={
                                <Row align="middle">
                                    <Col span={3}>
                                        <Switch defaultChecked={order == "desc"}
                                                style={{marginLeft: "10px"}}
                                                onChange={(e) => {
                                                    setOrder(e ? "desc" : "asc")
                                                }}
                                                size="small"
                                                checkedChildren={<CaretUpOutlined/>}
                                                unCheckedChildren={<CaretDownOutlined/>}
                                        />
                                    </Col>
                                    <Col span={18} style={{textAlign: "center"}}>
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
                                    </Col>
                                    <Col span={3}>
                                        <Button size="small" onClick={handleRefresh} icon={<SyncOutlined/>}
                                                style={{float: "right"}}/>
                                    </Col>
                                </Row>
                            }
                            size="small" style={{width: "100%"}}>
                            <Table dataSource={tasks}
                                   columns={columns}
                                   pagination={{...pagination, showTotal: handleShowTotal}}
                                   loading={loading}
                                   size="small"
                                   rowKey="uuid"
                                   showHeader={false}
                                   onChange={handleTableChange}
                                   style={{width: "100%"}}
                                   scroll={{x: "100%"}}
                                   locale={{
                                       emptyText: <div style={{textAlign: 'center'}}>
                                           <Empty
                                               image={Empty.PRESENTED_IMAGE_SIMPLE}
                                               description={
                                                   <span>No <a href="#API">tasks</a> found</span>
                                               }
                                           />
                                       </div>
                                   }}
                                   onRow={(record, rowIndex) => {
                                       return {
                                           onClick: event => {
                                               handleShowTaskDetails(record)
                                           }
                                       };
                                   }}
                            />
                        </Card>
                    </Row>
                </Col>
            </Row>

            <Drawer
                width="50vw"
                placement="right"
                closable={false}
                onClose={handleHideTaskDetails}
                visible={taskDetailsVisible}
            >
                <TaskDetailsDrawer task={currentTask}/>
            </Drawer>
        </>
    )
};

export default TasksPage
