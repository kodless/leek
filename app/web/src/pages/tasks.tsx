import React, {useState, useEffect} from "react";
import {Helmet} from 'react-helmet'
import {useQueryParam, StringParam} from "use-query-params";
import {Row, Drawer, message, Col, Table, Button, Switch, Card, Empty} from 'antd'
import {SyncOutlined, CaretUpOutlined, CaretDownOutlined} from '@ant-design/icons'

import TaskDataColumns from "../components/data/TaskData"
import AttributesFilter from '../components/filters/TaskAttributesFilter'
import TimeFilter from '../components/filters/TaskTimeFilter'
import TaskDetailsDrawer from '../containers/tasks/TaskDetailsDrawer'

import {useApplication} from "../context/ApplicationProvider"
import {TaskSearch} from "../api/task"
import {handleAPIError, handleAPIResponse} from "../utils/errors"
import {fixPagination} from "../utils/pagination";


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
        offset: 900000
    });
    const [order, setOrder] = useState<string>("desc");

    // Data
    const columns = TaskDataColumns();
    const [pagination, setPagination] = useState<any>({pageSize: 20, current: 1});
    const [loading, setLoading] = useState<boolean>();
    const [tasks, setTasks] = useState<any[]>([]);
    const [currentTask, setCurrentTask] = useState({});

    // UI
    const [taskDetailsVisible, setDetailsVisible] = useState(false);

    // API Calls
    function filterTasks(pager = {current: 1, pageSize: 20}) {
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
                // Prepare pagination
                let p = fixPagination(result.hits.total.value, pager, filterTasks);
                if (p) setPagination(p);
                else return;
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


    useEffect(() => {
        // console.log(tasks)
    }, [tasks]);

    // UI Callbacks
    function refresh(pager = {current: 1, pageSize: 20}) {
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
                    <AttributesFilter
                        onFilter={handleFilterChange}
                    />
                </Col>
                <Col xxl={19} xl={18} md={17} lg={16} sm={24} xs={24}>
                    <Row justify="center" style={{width: "100%"}}>
                        <Card
                            bodyStyle={{paddingBottom: 0, paddingRight: 0, paddingLeft: 0}}
                            size="small" style={{width: "100%"}}
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
                                        <TimeFilter timeFilter={timeFilters} onTimeFilterChange={setTimeFilters}/>
                                    </Col>
                                    <Col span={3}>
                                        <Button size="small" onClick={handleRefresh} icon={<SyncOutlined/>}
                                                style={{float: "right"}}/>
                                    </Col>
                                </Row>
                            }>
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
