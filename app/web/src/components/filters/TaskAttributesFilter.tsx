import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Input,
  Row,
  Select,
  Button,
  Form,
  InputNumber,
  Spin,
  Space,
  Collapse,
  Alert
} from "antd";
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";

import {
  useQueryParams,
  StringParam,
  NumberParam,
  ArrayParam,
  withDefault,
} from "use-query-params";
import { debounce } from "lodash";
import type { QueryParamConfig } from "use-query-params";

import { useApplication } from "../../context/ApplicationProvider";
import {TaskState, TaskStateClosable} from "../tags/TaskState";
import { badgedOption } from "../tags/BadgedOption";
import { MetricsService } from "../../api/metrics";
import { handleAPIError, handleAPIResponse } from "../../utils/errors"
import {DropdownFilter} from "./DropdownFilter";

const { Option } = Select;
const FormItem = Form.Item;
const { Panel } = Collapse;

interface TasksFilterContextData {
  onFilter(value: {});
  timeFilters: any;
}

const loadingIndicator = (
  <Row justify="center" align="middle" style={{ width: "100%" }}>
    <Spin size="small" />
  </Row>
);

const leadingWildcardNegateValidator = {
  pattern: /^(?!\*).*$/g,
  message: "Leading wildcard is not allowed on a keyword field!",
}

const JsonParam: QueryParamConfig<any[] | undefined> = {
  encode: (val) => {
    if (!val || !Array.isArray(val) || val.length === 0) return undefined;
    return JSON.stringify(val);
  },
  decode: (str) => {
    if (!str) return undefined;
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  },
};

type FieldKind = "string" | "number" | "array" | "object";

const fieldKinds: Record<string, FieldKind> = {
  // General
  "uuid": "string",
  "name_parts.function": "array",
  "name_parts.module": "array",
  "state": "array",

  // Input/Output
  "args_n": "object",
  "kwargs_flattened": "object",

  // Routing
  "routing_key": "array",
  "exchange": "array",
  "queue": "array",
  "worker": "array",
  "client": "string",

  // Errors
  "error.type": "array",
  "error.message": "string",
  "trace.wc": "string",

  // Execution
  "runtime_op": "string",
  "retries_op": "string",
  "runtime": "number",
  "retries": "number",

  // Relation
  "root_id": "string",
  "parent_id": "string",

  // Signals
  "revocation_reason": "string",
  "rejection_outcome": "string",
};

// which query keys live in which panel
const PANEL_FIELDS: Record<string, string[]> = {
  general: [
    "uuid",
    "name_parts.function",
    "name_parts.module",
    "state",
  ],
  io: [
    "args_n",
    "kwargs_flattened",
  ],
  routing: [
    "routing_key",
    "exchange",
    "queue",
    "worker",
    "client",
  ],
  errors: [
    "error.type",
    "error.message",
    "trace.wc",
  ],
  execution: [
    "runtime_op",
    "retries_op",
    "runtime",
    "retries",
  ],
  relation: [
    "root_id",
    "parent_id",
  ],
  signals: [
    "revocation_reason",
    "rejection_outcome",
  ],
};

const hasMeaningfulValue = (value: any) => {
  if (value == null) return false;           // null / undefined
  if (value === "") return false;           // empty string
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.keys(value).length > 0;   // non-empty object
  }
  return true;                              // numbers, booleans, non-empty string
};

const normalizeForQuery = (values: any) => {
  const next: any = { ...values };

  Object.entries(fieldKinds).forEach(([key, kind]) => {
    const value = next[key];

    switch (kind) {
      case "string": {
        // AntD inputs tend to give "" for empty; also guard null/undefined
        if (value === "" || value == null) {
          next[key] = undefined; // remove from URL
        }
        break;
      }

      case "number": {
        // InputNumber uses null when cleared
        if (value === null || value === "" || Number.isNaN(value)) {
          next[key] = undefined; // remove from URL
        }
        break;
      }

      case "array": {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          next[key] = undefined; // remove from URL and let withDefault([]) kick in on read
        }
        break;
      }

      case "object": {
        // For ObjectParam, remove when empty object or null/undefined
        if (
            value == null ||
            (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0)
        ) {
          next[key] = undefined; // remove from URL
        }
        break;
      }
    }
  });

  return next;
};

const TaskAttributesFilter: React.FC<TasksFilterContextData> = (
  props: TasksFilterContextData
) => {
  const [initialized, setInitialized] = React.useState(false);
  const [activePanels, setActivePanels] = React.useState<string[]>(["general", "io"]); // first + second by default
  const [panelsInitialized, setPanelsInitialized] = React.useState(false);
  const { currentEnv, currentApp } = useApplication();
  const metricsService = new MetricsService();
  const [form] = Form.useForm();

  // URL schema
  const [query, setQuery] = useQueryParams({
    // General
    "uuid": StringParam,
    "name_parts.function": withDefault(ArrayParam, []),
    "name_parts.module": withDefault(ArrayParam, []),
    "state": withDefault(ArrayParam, []),
    // Input/Output
    "args_n": JsonParam,
    "kwargs_flattened": JsonParam,
    "result": StringParam,
    // Routing
    "routing_key": withDefault(ArrayParam, []),
    "exchange": withDefault(ArrayParam, []),
    "queue": withDefault(ArrayParam, []),
    "worker": withDefault(ArrayParam, []),
    "client": StringParam,
    // Errors
    "error.type": withDefault(ArrayParam, []),
    "error.message": StringParam,
    "trace.wc": StringParam,
    // Execution
    "runtime_op": StringParam,
    "retries_op": StringParam,
    "runtime": NumberParam,
    "retries": NumberParam,
    // Relation
    "root_id": StringParam,
    "parent_id": StringParam,
    "root_name": StringParam,
    "parent_name": StringParam,
    // Signals
    "revocation_reason": StringParam,
    "rejection_outcome": StringParam,
  });

  const [seenRoutingKeys, setSeenRoutingKeys] = useState([]);
  const [seenExchanges, setSeenExchanges] = useState([]);
  const [seenQueues, setSeenQueues] = useState([]);
  const [seenWorkers, setSeenWorkers] = useState([]);

  // Fetch progress
  const [seenRoutingKeysFetching, setSeenRoutingKeysFetching] =
    useState<boolean>();
  const [seenExchangesFetching, setSeenExchangesFetching] =
      useState<boolean>();
  const [seenQueuesFetching, setSeenQueuesFetching] = useState<boolean>();
  const [seenWorkersFetching, setSeenWorkersFetching] = useState<boolean>();

  // UI Callbacks
  function handleReset() {
    form.resetFields();

    // get the post-reset values
    const values = form.getFieldsValue(true);
    const cleaned = normalizeForQuery(values);
    setQuery(cleaned, "replaceIn");

    form.submit();
  }

  function onSubmit(filters) {
    props.onFilter(filters);
  }

  function getSeenRoutingKeys(open) {
    if (!currentApp || !open) return;
    setSeenRoutingKeysFetching(true);
    metricsService
      .getSeenRoutingKeys(currentApp, currentEnv, props.timeFilters)
      .then(handleAPIResponse)
      .then((result: any) => {
        setSeenRoutingKeys(result.aggregations.seen_routing_keys.buckets);
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => setSeenRoutingKeysFetching(false));
  }

  function getSeenExchanges(open) {
    if (!currentApp || !open) return;
    setSeenExchangesFetching(true);
    metricsService
        .getSeenExchanges(currentApp, currentEnv, props.timeFilters)
        .then(handleAPIResponse)
        .then((result: any) => {
          setSeenExchanges(result.aggregations.seen_exchanges.buckets);
        }, handleAPIError)
        .catch(handleAPIError)
        .finally(() => setSeenExchangesFetching(false));
  }

  function getSeenQueues(open) {
    if (!currentApp || !open) return;
    setSeenQueuesFetching(true);
    metricsService
      .getSeenQueues(currentApp, currentEnv, props.timeFilters)
      .then(handleAPIResponse)
      .then((result: any) => {
        setSeenQueues(result.aggregations.seen_queues.buckets);
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => setSeenQueuesFetching(false));
  }

  function getSeenWorkers(open) {
    if (!currentApp || !open) return;
    setSeenWorkersFetching(true);
    metricsService
      .getSeenWorkers(currentApp, currentEnv, props.timeFilters)
      .then(handleAPIResponse)
      .then((result: any) => {
        setSeenWorkers(result.aggregations.seen_workers.buckets);
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => setSeenWorkersFetching(false));
  }

  // URL → FORM on mount + when URL changes
  useEffect(() => {
    if (!initialized) {
      form.setFieldsValue(query);
      setInitialized(true);
      form.submit();
    }
  }, [initialized, form, query]);

  // Collapse panels: open ones that have values in query, but only once on mount
  useEffect(() => {
    if (panelsInitialized) return;

    const panelsWithValues: string[] = [];

    Object.entries(PANEL_FIELDS).forEach(([panelKey, fields]) => {
      const panelHasData = fields.some((fieldKey) => {
        const v = (query as any)[fieldKey];
        return hasMeaningfulValue(v);
      });

      if (panelHasData) {
        panelsWithValues.push(panelKey);
      }
    });

    const defaults = ["general", "io"]; // first + second panel
    const merged = Array.from(new Set([...defaults, ...panelsWithValues]));

    setActivePanels(merged);
    setPanelsInitialized(true);
  }, [query, panelsInitialized]);

  // FORM → URL on change
  const handleValuesChange = useMemo(
      () =>
          debounce((changedValues, allValues) => {
            // Helper: all pair rows have both key + value
            const pairsComplete = (pairs?: { key?: any; value?: any }[]) =>
                !pairs || pairs.length === 0 ||
                pairs.every(p =>
                    p &&
                    p.key !== undefined &&
                    p.key !== null &&
                    p.key !== "" &&
                    p.value !== undefined &&
                    p.value !== null &&
                    p.value !== ""
                );

            // Handle runtime + runtime_op as a pair
            const runtimeBothReady =
                allValues.runtime_op &&
                allValues.runtime !== undefined &&
                allValues.runtime !== null &&
                allValues.runtime !== "";
            if (changedValues.runtime_op || changedValues.runtime) {
              if (!runtimeBothReady) return; // skip until complete
            }
            // Handle retries + retries_op as a pair
            const retriesBothReady =
                allValues.retries_op &&
                allValues.retries !== undefined &&
                allValues.retries !== null &&
                allValues.retries !== "";
            if (changedValues.retries_op || changedValues.retries) {
              if (!retriesBothReady) return; // skip until complete
            }

            // args_n: only notify once all rows have key+value
            if ("args_n" in changedValues) {
              if (!pairsComplete(allValues.args_n)) return;
            }

            // kwargs_flattened: only notify once all rows have key+value
            if ("kwargs_flattened" in changedValues) {
              if (!pairsComplete(allValues.kwargs_flattened)) return;
            }

            // Normal fields → update query + submit immediately
            const cleaned = normalizeForQuery(allValues)
            setQuery(cleaned, "replaceIn");
            form.submit();

          }, 300), // 150–300ms usually feels good
      [form, setQuery, props.onFilter]
  );

  // Helper to normalize comparison
  const norm = (v) => String(v ?? "").trim().toLowerCase();

  return (
    <Card
      title={
        <Button size="small" type="primary" onClick={form.submit}>
          Filter
        </Button>
      }
      size={"small"}
      extra={
        <Button onClick={handleReset} size="small">
          Reset
        </Button>
      }
      style={{ width: "100%" }}
      bodyStyle={{ padding: 0 }}
    >
      <Form
        style={{ width: "100%" }}
        form={form}
        onFinish={onSubmit}
        onFinishFailed={({ values, errorFields }) => {
          console.log("onFinishFailed", { values, errorFields });
        }}
        onValuesChange={handleValuesChange}
      >
        <Collapse
            size="small"
            bordered={true}
            activeKey={activePanels}
            onChange={(keys) => setActivePanels(keys as string[])}
            destroyInactivePanel={false}
            style={{borderLeft: "none", borderRight: "none"}}
        >
          <Panel header="General" key="general" forceRender>
            <Row>
              <FormItem name="uuid" style={{ width: "100%" }}>
                <Input placeholder="uuid" allowClear />
              </FormItem>
            </Row>
            <Row>
              <FormItem name="name_parts.function" style={{ width: "100%" }}>
                <DropdownFilter
                    filter_key={"name_parts.function"}
                    placeholder={"Function name"}
                    filters={props.timeFilters}
                />
              </FormItem>
            </Row>
            <Row>
              <FormItem name="name_parts.module" style={{ width: "100%" }}>
                <DropdownFilter
                    filter_key={"name_parts.module"}
                    placeholder={"Module name"}
                    filters={props.timeFilters}
                />
              </FormItem>
            </Row>
            <Row>
              <FormItem name="state" style={{ width: "100%" }}>
                <Select
                    placeholder="State"
                    mode="multiple"
                    tagRender={TaskStateClosable}
                    style={{ width: "100%" }}
                    allowClear
                >
                  <Option key="QUEUED" value="QUEUED">
                    <TaskState state={"QUEUED"} />
                  </Option>
                  <Option key="RECEIVED" value="RECEIVED">
                    <TaskState state={"RECEIVED"} />
                  </Option>
                  <Option key="STARTED" value="STARTED">
                    <TaskState state={"STARTED"} />
                  </Option>
                  <Option key="SUCCEEDED" value="SUCCEEDED">
                    <TaskState state={"SUCCEEDED"} />
                  </Option>
                  <Option key="RECOVERED" value="RECOVERED">
                    <TaskState state={"RECOVERED"} />
                  </Option>
                  <Option key="RETRY" value="RETRY">
                    <TaskState state={"RETRY"} />
                  </Option>
                  <Option key="FAILED" value="FAILED">
                    <TaskState state={"FAILED"} />
                  </Option>
                  <Option key="CRITICAL" value="CRITICAL">
                    <TaskState state={"CRITICAL"} />
                  </Option>
                  <Option key="REJECTED" value="REJECTED">
                    <TaskState state={"REJECTED"} />
                  </Option>
                  <Option key="REVOKED" value="REVOKED">
                    <TaskState state={"REVOKED"} />
                  </Option>
                </Select>
              </FormItem>
            </Row>
          </Panel>
          <Panel header="Input/Output" key="io" forceRender>
            <Row style={{marginBottom: 15}}>
              <Alert style={{width: "100%"}} message="Works well with untruncated values" type="success" />
            </Row>
            <Row>
              <Form.List name="args_n">
                {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                          <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                            <Form.Item
                                {...restField}
                                name={[name, "key"]}
                                style={{ width: "100%" }}
                                validateTrigger={["onChange", "onBlur"]}
                                rules={[
                                  { required: true, message: "Missing key" },
                                  // Unique key validator
                                  () => ({
                                    validator(_, value) {
                                      // Treat only truly empty values as "no value"
                                      if (value === undefined || value === null || value === "") {
                                        return Promise.resolve();
                                      }
                                      const pairs = form.getFieldValue("args_n") || [];
                                      const isDup = pairs.some((row, idx) => {
                                        if (idx === name) return false; // ignore self
                                        return norm(row?.key) === norm(value);
                                      });
                                      return isDup
                                          ? Promise.reject(new Error("Key must be unique"))
                                          : Promise.resolve();
                                    },
                                  }),
                                ]}
                            >
                              <InputNumber
                                  min={0}
                                  max={9}
                                  step={1}
                                  placeholder="Position"
                              />
                            </Form.Item>
                            <Form.Item
                                {...restField}
                                name={[name, "value"]}
                                rules={[{ required: true, message: "Missing value" }]}
                            >
                              <Input placeholder="Value" />
                            </Form.Item>
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          </Space>
                      ))}
                      <Form.Item style={{width: "100%"}}>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          Add args field
                        </Button>
                      </Form.Item>
                    </>
                )}
              </Form.List>
            </Row>
            <Row>
              <Form.List name="kwargs_flattened">
                {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                          <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                            <Form.Item
                                {...restField}
                                name={[name, "key"]}
                                style={{ width: "100%" }}
                                validateTrigger={["onChange", "onBlur"]}
                                rules={[
                                  { required: true, message: "Missing key" },
                                  // Unique key validator
                                  () => ({
                                    validator(_, value) {
                                      if (!value) return Promise.resolve();
                                      const pairs = form.getFieldValue("kwargs_flattened") || [];
                                      const isDup = pairs.some((row, idx) => {
                                        if (idx === name) return false; // ignore self
                                        return norm(row?.key) === norm(value);
                                      });
                                      return isDup
                                          ? Promise.reject(new Error("Key must be unique"))
                                          : Promise.resolve();
                                    },
                                  }),
                                ]}
                            >
                              <Input placeholder="Key" />
                            </Form.Item>
                            <Form.Item
                                {...restField}
                                name={[name, "value"]}
                                rules={[{ required: true, message: "Missing value" }]}
                            >
                              <Input placeholder="Value" />
                            </Form.Item>
                            <MinusCircleOutlined onClick={() => remove(name)} />
                          </Space>
                      ))}
                      <Form.Item style={{width: "100%"}}>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          Add kwargs field
                        </Button>
                      </Form.Item>
                    </>
                )}
              </Form.List>
            </Row>
            <Row>
              <FormItem
                  name="result"
                  style={{ width: "100%" }}
                  rules={[leadingWildcardNegateValidator]}
              >
                <Input placeholder="Result (wildcard)" allowClear />
              </FormItem>
            </Row>
          </Panel >
          <Panel header="Routing" key="routing" forceRender>
            <Row>
              <FormItem name="routing_key" style={{ width: "100%" }}>
                <Select
                    placeholder="Routing key"
                    mode="multiple"
                    style={{ width: "100%" }}
                    notFoundContent={
                      seenRoutingKeysFetching ? loadingIndicator : null
                    }
                    onDropdownVisibleChange={getSeenRoutingKeys}
                    allowClear
                >
                  {seenRoutingKeys.map((rq, key) => badgedOption(rq))}
                </Select>
              </FormItem>
            </Row>
            <Row>
              <FormItem name="exchange" style={{ width: "100%" }}>
                <Select
                    placeholder="Exchange"
                    mode="multiple"
                    style={{ width: "100%" }}
                    notFoundContent={
                      seenExchangesFetching ? loadingIndicator : null
                    }
                    onDropdownVisibleChange={getSeenExchanges}
                    allowClear
                >
                  {seenExchanges.map((exchange, key) => badgedOption(exchange, "", "default exchange"))}
                </Select>
              </FormItem>
            </Row>
            <Row>
              <FormItem name="queue" style={{ width: "100%" }}>
                <Select
                    placeholder="Queue"
                    mode="multiple"
                    style={{ width: "100%" }}
                    notFoundContent={seenQueuesFetching ? loadingIndicator : null}
                    onDropdownVisibleChange={getSeenQueues}
                    allowClear
                >
                  {seenQueues.map((queue, key) => badgedOption(queue))}
                </Select>
              </FormItem>
            </Row>
            <Row>
              <FormItem name="worker" style={{ width: "100%" }}>
                <Select
                    placeholder="Worker"
                    mode="multiple"
                    style={{ width: "100%" }}
                    notFoundContent={seenWorkersFetching ? loadingIndicator : null}
                    onDropdownVisibleChange={getSeenWorkers}
                    allowClear
                >
                  {seenWorkers.map((worker, key) => badgedOption(worker))}
                </Select>
              </FormItem>
            </Row>
            <Row>
              <FormItem name="client" style={{ width: "100%" }}>
                <Input placeholder="Client" allowClear />
              </FormItem>
            </Row>
          </Panel>
          <Panel header="Errors" key="errors" forceRender>
            <Row>
              <FormItem name="error.type" style={{ width: "100%" }}>
                <DropdownFilter
                    filter_key={"error.type"}
                    placeholder={"Error type"}
                    filters={props.timeFilters}
                />
              </FormItem>
            </Row>
            <Row>
              <FormItem name="error.message" style={{ width: "100%" }}>
                <Input placeholder="Error message" allowClear />
              </FormItem>
            </Row>
            <Row>
              <FormItem name="trace.wc" style={{ width: "100%" }}>
                <Input placeholder="Stacktrace" allowClear />
              </FormItem>
            </Row>
          </Panel>
          <Panel header="Execution" key="execution" forceRender>
            <Row>
              <Input.Group compact>
                <FormItem name="runtime_op" style={{ width: "30%" }}>
                  <Select placeholder={"operator"} style={{ width: "100%" }}>
                    <Option value="gte">{"gte"}</Option>
                    <Option value="lte">{"lte"}</Option>
                  </Select>
                </FormItem>
                <FormItem name="runtime" style={{ width: "70%" }}>
                  <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      max={10000}
                      step={0.0001}
                      placeholder="Runtime"
                  />
                </FormItem>
              </Input.Group>
            </Row>
            <Row>
              <Input.Group compact>
                <FormItem name="retries_op" style={{ width: "30%" }}>
                  <Select placeholder={"operator"} style={{ width: "100%" }}>
                    <Option value="gte">{"gte"}</Option>
                    <Option value="lte">{"lte"}</Option>
                  </Select>
                </FormItem>
                <FormItem name="retries" style={{ width: "70%" }}>
                  <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      max={10000}
                      step={1}
                      placeholder="Retries"
                  />
                </FormItem>
              </Input.Group>
            </Row>
          </Panel>
          <Panel header="Relation" key="relation" forceRender>
            <Row>
              <FormItem name="root_id" style={{ width: "100%" }}>
                <Input placeholder="Root id" allowClear />
              </FormItem>
            </Row>
            <Row>
              <FormItem name="parent_id" style={{ width: "100%" }}>
                <Input placeholder="Parent id" allowClear />
              </FormItem>
            </Row>
            <Row>
              <FormItem name="root_name" style={{ width: "100%" }}>
                <Select placeholder="Root name (soon)" disabled={true}></Select>
              </FormItem>
            </Row>
            <Row>
              <FormItem name="parent_name" style={{ width: "100%" }}>
                <Select placeholder="Parent name (soon)" disabled={true}></Select>
              </FormItem>
            </Row>
          </Panel>
          <Panel header="Signals" key="signals" forceRender>
            <Row>
              <FormItem name="revocation_reason" style={{ width: "100%" }}>
                <Select placeholder="Revocation reason" allowClear>
                  <Option value="expired">{"Expired"}</Option>
                  <Option value="terminated">{"Terminated"}</Option>
                </Select>
              </FormItem>
            </Row>
            <Row>
              <FormItem name="rejection_outcome" style={{ width: "100%" }}>
                <Select placeholder="Rejection outcome" allowClear>
                  <Option value="requeued">{"Requeued"}</Option>
                  <Option value="ignored">{"Ignored"}</Option>
                </Select>
              </FormItem>
            </Row>
          </Panel>
          <Panel header="Fallbacks" key="8" forceRender>
            <Row style={{marginBottom: 15}}>
              <Alert message="Use these filters if args/kwargs/stacktrace were truncated" type="warning" />
            </Row>
            <Row>
              <FormItem
                  name="args"
                  style={{ width: "100%" }}
                  rules={[leadingWildcardNegateValidator]}
              >
                <Input placeholder="args (wildcard)" allowClear />
              </FormItem>
            </Row>
            <Row>
              <FormItem
                  name="kwargs"
                  style={{ width: "100%" }}
                  rules={[leadingWildcardNegateValidator]}
              >
                <Input placeholder="kwargs (wildcard)" allowClear />
              </FormItem>
            </Row>
          </Panel>
        </Collapse>
      </Form>
    </Card>
  );
};

export default TaskAttributesFilter;
