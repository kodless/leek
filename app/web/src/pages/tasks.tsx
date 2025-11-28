import React, { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import useSound from 'use-sound';
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
  List, Tooltip,
} from "antd";
import {
  SyncOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PauseOutlined,
  CaretRightOutlined,
  LoadingOutlined,
  SoundOutlined,
  NotificationOutlined
} from "@ant-design/icons";

import TaskDataColumns from "../components/data/TaskData";
import AttributesFilter from "../components/filters/TaskAttributesFilter";
import TimeFilter from "../components/filters/TaskTimeFilter";

import { useApplication } from "../context/ApplicationProvider";
import { TaskService } from "../api/task";
import { ControlService } from "../api/control";
import {BackupService} from "../api/backup";
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

let timeout;

const TasksPage: React.FC = () => {
  // Services
  const service = new TaskService();
  const controlService = new ControlService();
  const backupService = new BackupService();

  // Providers
  const { currentApp, currentEnv } = useApplication();

  // Filters
  const [filters, setFilters] = useState<any>();
  const [timeFilters, setTimeFilters] = useState<any>({
    timestamp_type: "timestamp",
    interval_type: "past",
    offset: 900000,
  });

  // track when children have hydrated from URL
  const [attrFiltersReady, setAttrFiltersReady] = useState(false);
  const [timeFiltersReady, setTimeFiltersReady] = useState(false);

  // ---- Handlers passed to children ----
  const handleFilterChange = useCallback((values: any) => {
    setFilters(values);
    setAttrFiltersReady(true);   // ✅ attributes filter hydrated
  }, []);

  const handleTimeFilterChange = useCallback((values: any) => {
    setTimeFilters(values);
    setTimeFiltersReady(true);   // ✅ time filter hydrated
  }, []);

  // Knobs
  const [order, setOrder] = useState<string>("desc");
  const [live, setLive] = useState<boolean>(false);
  const [alarm, setAlarm] = useState<boolean>(false);

  // Pagination
  const [pagination, setPagination] = useState<any>({
    pageSize: 20,
    current: 1,
  });

  // Status
  const [loading, setLoading] = useState<boolean>();
  const [tasksRetrying, setTasksRetrying] = useState<boolean>();
  const [tasksExporting, setTasksExporting] = useState<boolean>();

  // Data
  const columns = TaskDataColumns();
  const [tasks, setTasks] = useState<any[]>([]);
  const prevTasksRef = useRef<any[]>([]);

  // Sounds
  const [playActive] = useSound(
      '/sounds/pop-down.mp3',
      { volume: 0.35 }
  );
  const [playOn] = useSound(
      '/sounds/pop-up-on.mp3',
      { volume: 0.35 }
  );
  const [playOff] = useSound(
      '/sounds/pop-up-off.mp3',
      { volume: 0.35 }
  );
  const [playAlarm] = useSound(
      '/sounds/fanfare.mp3',
      { volume: 0.35 }
  );

  // API Calls
  const requestIdRef = useRef(0);

  function filterTasks(pager = { current: 1, pageSize: 20 }) {
    if (!currentApp) return;
    setLoading(true);

    const currentRequestId = ++requestIdRef.current;

    let allFilters = {
      ...filters,
      ...timeFilters,
    };
    let from_ = (pager.current - 1) * pager.pageSize;

    service
      .filter(currentApp, currentEnv, pager.pageSize, from_, order, allFilters)
      .then(handleAPIResponse)
      .then((result: any) => {
        // Ignore stale responses
        if (currentRequestId !== requestIdRef.current) return;

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
      .finally(() => {
        // Only stop loading if this is the latest request
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }

  // Hooks
  useEffect(() => {
    /**
     * Play alarm only if:
     * 1: live mode is on
     * 2: alarm mode is on
     * 3: there was 0 tasks during previous lookup
     * 4: there is one or more tasks during current fetch
     */
    if (live && alarm && prevTasksRef.current.length == 0 && tasks.length > 0) {
      playAlarm()
    }
    prevTasksRef.current = tasks;

    // Failsafe, disable alarm when tasks are discovered.
    if (tasks.length > 0) {
      setAlarm(false)
    }
  }, [tasks]);

  useEffect(() => {
    // Don't fire until we know both filters have hydrated from URL
    if (!currentApp || !currentEnv) return;
    if (!attrFiltersReady || !timeFiltersReady) return;

    // Stop refreshing queues
    if (timeout) clearInterval(timeout);

    if (live) {
      refresh(pagination);
      timeout = setInterval(() => {
        refresh(pagination);
      }, 7000);
    }
    else {
      refresh(pagination);
    }
  }, [currentApp, currentEnv, filters, timeFilters, order, live, attrFiltersReady, timeFiltersReady]);

  // UI Callbacks
  function refresh(pager = { current: 1, pageSize: 20 }) {
    filterTasks(pager);
  }

  function handleRefresh() {
    refresh(pagination);
  }

  function handleTableChange(pagination, filters, sorter) {
    refresh(pagination);
  }

  // Handlers and Helpers
  function handleShowTaskDetails(record) {
    window.open(
        `/task?app=${currentApp}&env=${currentEnv}&uuid=${record.uuid}`,
        "_blank"
    );
  }

  function handleShowTotal(total) {
    return `Total of ${total} tasks`;
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
      width: 800,
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
            {(filters?.state?.length || -1) < 0 && <Text type="warning" italic strong>Note: you didn't filter by state. thus, will retry all filtered tasks in a failure terminal state (FAILED, CRITICAL, REVOKED, REJECTED).</Text>}
          </Typography.Paragraph>
          {result.ineligible_tasks_count > 0 &&
            prepareList(result.ineligible_tasks_ids)}
          {result.ineligible_tasks_count > 0 &&
            <Typography.Paragraph>
              <blockquote>
                Task is considered ineligible if:
                <ul>
                  <li>It's not in a failure terminal state (FAILED, CRITICAL, REVOKED, REJECTED).</li>
                  <li>It's not routable, does not have a routing key and exchange.</li>
                  <li>Its args and kwargs are truncated, workers <a href="https://docs.celeryq.dev/en/latest/reference/celery.app.task.html#celery.app.task.Task.resultrepr_maxsize" target="_blank">truncate large args and kwargs</a> before sending them to Leek (Most probable)</li>
                </ul>
                <Text type="warning" italic strong>Note: Tasks in SUCCEEDED, RECOVERED state do not support bulk retries. However, you can retry single task on task details page.</Text>
              </blockquote>

            </Typography.Paragraph>
          }
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

  function exportByQuery() {
    if (!currentApp || !currentEnv) return;
    setTasksExporting(true);
    let allFilters = { ...filters, ...timeFilters };
    return backupService
        .exportByQuery(currentApp, currentEnv, allFilters)
        .then((response: any) => {
          if (response.ok) {
            return response.blob().then(function(blob) {
              const header = response.headers.get("Content-Disposition");
              const parts = header!.split(";");
              const filename = parts[1].split('=')[1];
              let elm = document.createElement("a");
              elm.href = URL.createObjectURL(blob);
              elm.setAttribute("download", filename);
              elm.click();
              elm.remove();
            });
          }
          return Promise.resolve(response.json()).then((responseInJson) => {
            return Promise.reject(responseInJson.error);
          });
        }
        , handleAPIError)
        .catch(handleAPIError)
        .finally(() => setTasksExporting(false));
  }

  useEffect(() => {
    // Stop refreshing queues
    if (timeout) clearInterval(timeout);

    return () => {
      clearInterval(timeout);
    };
  }, []);

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
            timeFilters={timeFilters}
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
                      onTimeFilterChange={handleTimeFilterChange}
                    />
                  </Col>
                  <Col span={3}>
                    <Space style={{ float: "right" }}>
                      {tasks.length > 0 &&
                        <Button
                          ghost
                          type="primary"
                          size="small"
                          onClick={handleRetryFiltered}
                          loading={tasksRetrying}
                        >
                          Retry Filtered
                        </Button>
                      }
                      {tasks.length > 0 &&
                        <Button
                            type="secondary"
                            size="small"
                            onClick={exportByQuery}
                            loading={tasksExporting}
                        >
                          Export Filtered
                        </Button>
                      }
                      <Tooltip
                          title={"Play sound alert when one or more tasks found, only applicable when live mode is on and table is empty."}
                      >
                        <Button
                            size="small"
                            onClick={() => {setAlarm(!alarm)}}
                            icon={alarm ? <SoundOutlined style={{color: '#333'}} /> : <NotificationOutlined/>}
                            type={alarm ? "primary" : "secondary"}
                            style={alarm ? {background: "gold", borderColor: "gold"} : {}}
                            onMouseDown={playActive}
                            onMouseUp={() => {
                              alarm ? playOff() : playOn();
                            }}
                            disabled={!live || tasks.length>0}
                        />
                      </Tooltip>
                      <Button
                          size="small"
                          onClick={() => {setLive(!live)}}
                          icon={live ? <PauseOutlined style={{color: '#fff'}} /> : <CaretRightOutlined style={{color: "#33ccb8"}}/>}
                          type={live ? "primary" : "secondary"}
                          danger={live}
                          onMouseDown={playActive}
                          onMouseUp={() => {
                            live ? playOff() : playOn();
                          }}
                      />
                      <Button
                        size="small"
                        onClick={handleRefresh}
                        icon={live ? <LoadingOutlined /> : <SyncOutlined />}
                        disabled={live}
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
