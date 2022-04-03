import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Row,
  Col,
  Table,
  Button,
  Switch,
  Card,
  Empty,
  message,
  Space,
  Typography,
  Modal,
  List,
} from "antd";
import {
  SyncOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import TaskDataColumns from "../components/data/TaskData";
import AttributesFilter from "../components/filters/TaskAttributesFilter";
import TimeFilter from "../components/filters/TaskTimeFilter";

import { useApplication } from "../context/ApplicationProvider";
import { TaskService } from "../api/task";
import { ControlService } from "../api/control";
import { handleAPIError, handleAPIResponse } from "../utils/errors";
import { fixPagination } from "../utils/pagination";

const TerminalStates = [
  "SUCCEEDED",
  "FAILED",
  "REJECTED",
  "REVOKED",
  "RECOVERED",
  "CRITICAL",
];
const { confirm } = Modal;
const { Text } = Typography;

const TasksPage: React.FC = () => {
  // STATE
  const service = new TaskService();
  const controlService = new ControlService();
  const { currentApp, currentEnv } = useApplication();

  // Filters
  const [filters, setFilters] = useState<any>();
  const [timeFilters, setTimeFilters] = useState<any>({
    timestamp_type: "timestamp",
    interval_type: "past",
    offset: 900000,
  });
  const [order, setOrder] = useState<string>("desc");

  // Data
  const columns = TaskDataColumns();
  const [pagination, setPagination] = useState<any>({
    pageSize: 20,
    current: 1,
  });
  const [loading, setLoading] = useState<boolean>();
  const [tasksRetrying, setTasksRetrying] = useState<boolean>();
  const [tasks, setTasks] = useState<any[]>([]);

  // API Calls
  function filterTasks(pager = { current: 1, pageSize: 20 }) {
    if (!currentApp) return;
    setLoading(true);
    let allFilters = {
      ...filters,
      ...timeFilters,
    };
    let from_ = (pager.current - 1) * pager.pageSize;
    service
      .filter(currentApp, currentEnv, pager.pageSize, from_, order, allFilters)
      .then(handleAPIResponse)
      .then((result: any) => {
        // Prepare pagination
        let p = fixPagination(result.hits.total.value, pager, filterTasks);
        if (p) setPagination(p);
        else return;
        // Result
        let tasksList: { any }[] = [];
        result.hits.hits.forEach(function (hit) {
          tasksList.push(hit._source);
        });
        setTasks(tasksList);
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => setLoading(false));
  }

  // Hooks
  useEffect(() => {
    refresh(pagination);
  }, [currentApp, currentEnv, filters, timeFilters, order]);

  useEffect(() => {
    //console.log(tasks)
  }, [tasks]);

  // UI Callbacks
  function refresh(pager = { current: 1, pageSize: 20 }) {
    filterTasks(pager);
  }

  function handleShowTaskDetails(record) {
    window.open(
      `/task?app=${currentApp}&env=${currentEnv}&uuid=${record.uuid}`,
      "_blank"
    );
  }

  function handleRefresh() {
    refresh(pagination);
  }

  function handleShowTotal(total) {
    return `Total of ${total} tasks`;
  }

  function handleTableChange(pagination, filters, sorter) {
    refresh(pagination);
  }

  function handleFilterChange(values) {
    setFilters(values);
  }

  function prepareList(items) {
    return (
      <List
        header={
          <Row justify="center">
            <Text strong>Ineligible Tasks IDs</Text>
          </Row>
        }
        dataSource={items}
        style={{ maxHeight: 200, overflow: "auto" }}
        size="small"
        bordered
        renderItem={(item) => <List.Item>{item}</List.Item>}
      />
    );
  }

  function bulkRetryConfirmation(result) {
    if (result.eligible_tasks_count == 0) {
      message.warning("Found no eligible tasks for retrying!");
      return;
    }
    confirm({
      title: "Retry Filtered Tasks",
      icon: <ExclamationCircleOutlined />,
      content: (
        <>
          <Typography.Paragraph>
            Do you really want to retry filtered tasks?
            <ul>
              <li>
                {result.eligible_tasks_count} tasks are eligible to be retried.
              </li>
              <li>
                {result.ineligible_tasks_count} tasks are not eligible to be
                retried.
              </li>
            </ul>
          </Typography.Paragraph>
          {result.ineligible_tasks_count > 0 &&
            prepareList(result.ineligible_tasks_ids)}
        </>
      ),
      onOk() {
        return retryFiltered(false);
      },
    });
  }

  function pendingBulkRetry(result) {
    confirm({
      title: "Bulk tasks retry initiated!",
      icon: <CheckCircleOutlined style={{ color: "#00BFA6" }} />,
      content: (
        <>
          <Typography.Paragraph>
            Tasks queued to the broker, you can filter the retried tasks using
            the client name.
            <ul>
              <li>
                Client name:{" "}
                <Text copyable code>
                  {result.origin}
                </Text>
              </li>
              <li>{result.succeeded_retries_count} tasks set to retry.</li>
              <li>{result.failed_retries_count} tasks could not be retried.</li>
            </ul>
          </Typography.Paragraph>
          {result.failed_retries_count > 0 &&
            prepareList(result.failed_retries)}
        </>
      ),
      okText: "Ok",
      cancelButtonProps: { style: { display: "none" } },
    });
  }

  function retryFiltered(dryRun) {
    if (!currentApp || !currentEnv) return;
    setTasksRetrying(true);
    let allFilters = { ...filters, ...timeFilters };
    return controlService
      .retryTasksByQuery(currentApp, currentEnv, allFilters, dryRun)
      .then(handleAPIResponse)
      .then((result: any) => {
        if (dryRun) {
          bulkRetryConfirmation(result);
        } else {
          pendingBulkRetry(result);
        }
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => setTasksRetrying(false));
  }

  function handleRetryFiltered() {
    retryFiltered(true);
  }

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Tasks</title>
        <meta name="description" content="List of tasks" />
        <meta name="keywords" content="celery, tasks" />
      </Helmet>

      <Row style={{ marginBottom: "16px" }} gutter={[12, 12]}>
        <Col xxl={5} xl={6} md={7} lg={8} sm={24} xs={24}>
          <AttributesFilter
            onFilter={handleFilterChange}
            filters={timeFilters}
          />
        </Col>
        <Col xxl={19} xl={18} md={17} lg={16} sm={24} xs={24}>
          <Row justify="center" style={{ width: "100%" }}>
            <Card
              bodyStyle={{ paddingBottom: 0, paddingRight: 0, paddingLeft: 0 }}
              size="small"
              style={{ width: "100%" }}
              title={
                <Row align="middle">
                  <Col span={3}>
                    <Switch
                      defaultChecked={order == "desc"}
                      style={{ marginLeft: "10px" }}
                      onChange={(e) => {
                        setOrder(e ? "desc" : "asc");
                      }}
                      size="small"
                      checkedChildren={
                        <CaretUpOutlined style={{ color: "#333" }} />
                      }
                      unCheckedChildren={<CaretDownOutlined />}
                    />
                  </Col>
                  <Col span={18} style={{ textAlign: "center" }}>
                    <TimeFilter
                      timeFilter={timeFilters}
                      onTimeFilterChange={setTimeFilters}
                    />
                  </Col>
                  <Col span={3}>
                    <Space style={{ float: "right" }}>
                      {filters &&
                        filters.state &&
                        filters.state.length &&
                        filters.state.every((s) =>
                          TerminalStates.includes(s)
                        ) && (
                          <Button
                            ghost
                            type="primary"
                            size="small"
                            onClick={handleRetryFiltered}
                            loading={tasksRetrying}
                          >
                            Retry Filtered
                          </Button>
                        )}
                      <Button
                        size="small"
                        onClick={handleRefresh}
                        icon={<SyncOutlined />}
                      />
                    </Space>
                  </Col>
                </Row>
              }
            >
              <Table
                dataSource={tasks}
                columns={columns}
                pagination={{ ...pagination, showTotal: handleShowTotal }}
                loading={loading}
                size="small"
                rowKey="uuid"
                showHeader={false}
                onChange={handleTableChange}
                style={{ width: "100%" }}
                scroll={{ x: "100%" }}
                locale={{
                  emptyText: (
                    <div style={{ textAlign: "center" }}>
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span>
                            No <a href="#API">tasks</a> found
                          </span>
                        }
                      />
                    </div>
                  ),
                }}
                onRow={(record, rowIndex) => {
                  return {
                    onClick: (event) => {
                      handleShowTaskDetails(record);
                    },
                  };
                }}
              />
            </Card>
          </Row>
        </Col>
      </Row>
    </>
  );
};

export default TasksPage;
