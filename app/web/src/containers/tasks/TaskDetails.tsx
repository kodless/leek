import React, { useState } from "react";
import {
  Typography,
  Tabs,
  List,
  Row,
  Col,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Checkbox,
  Divider,
  Tree, Card, message
} from "antd";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atelierCaveDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { adaptTime } from "../../utils/date";
import TaskDetails from "./TaskDetails.style";
import { buildTag } from "../../components/data/TaskData";
import { ControlService } from "../../api/control";
import { TaskService } from "../../api/task";
import { handleAPIError, handleAPIResponse } from "../../utils/errors";
import { useApplication } from "../../context/ApplicationProvider";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  SyncOutlined,
  ApartmentOutlined,
  NodeIndexOutlined,
  PlayCircleOutlined,
  FieldTimeOutlined,
  CheckOutlined,
  CloseOutlined,
  FundFilled
} from "@ant-design/icons";
import {LeekPie} from "../../components/charts/Pie";
import {useThemeSwitcher} from "react-css-theme-switcher";

const Text = Typography.Text;
const { TabPane } = Tabs;

const { confirm } = Modal;
const FormItem = Form.Item;
const Option = Select.Option;
const TerminalStates = [
  "SUCCEEDED",
  "FAILED",
  "REJECTED",
  "REVOKED",
  "RECOVERED",
  "CRITICAL",
];

const STATES_ICONS_MAP = {
  "QUEUED": <LoadingOutlined style={{color: '#08c', fontSize: 10}} />,
  "RECEIVED": <LoadingOutlined style={{color: '#08c', fontSize: 10}} />,
  "STARTED": <LoadingOutlined style={{color: '#08c', fontSize: 10}} />,
  "RETRY": <LoadingOutlined style={{color: '#08c', fontSize: 10}} />,
  "SUCCEEDED": <CheckOutlined style={{color: '#33ccb8', fontSize: 10}} />,
  "RECOVERED": <CheckOutlined style={{color: '#33ccb8', fontSize: 10}} />,
  "FAILED": <CloseOutlined style={{color: '#E0144C', fontSize: 10}} />,
  "CRITICAL": <CloseOutlined style={{color: '#E0144C', fontSize: 10}} />,
  "REJECTED": <CloseOutlined style={{color: '#E0144C', fontSize: 10}} />,
  "REVOKED": <CloseOutlined style={{color: '#E0144C', fontSize: 10}} />,
}

export default (props) => {
  const { currentApp, currentEnv } = useApplication();
  const service = new ControlService();
  const task = new TaskService();
  const { currentTheme } = useThemeSwitcher();
  const [retrying, setRetrying] = useState<boolean>();
  const [revoking, setRevoking] = useState<boolean>();
  const [buildingTree, setBuildingTree] = useState<boolean>();
  const [workflow, setWorkflow] = useState<any>(null);
  const [isRevokeModalVisible, setIsRevokeModalVisible] = useState(false);

  function retry() {
    if (!currentApp) return;
    setRetrying(true);
    return service
      .retryTask(currentApp, props.task.uuid)
      .then(handleAPIResponse)
      .then((result: any) => {
        retriedSuccessfully(result.task_id);
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => setRetrying(false));
  }

  function handleRetryTask() {
    confirm({
      title: "Do you really want to retry this task?",
      icon: <ExclamationCircleOutlined />,
      content: (
        <>
          <Typography.Paragraph>
            Task retry is an experimental feature for now!
          </Typography.Paragraph>
          <Typography.Paragraph>
            Tasks part of chains, groups or chords will not be retried as part
            of them!
          </Typography.Paragraph>
        </>
      ),
      onOk: () => {
        return retry();
      },
      okText: "Retry",
      cancelText: "Cancel",
    });
  }

  function retriedSuccessfully(task_id) {
    confirm({
      title: "Task retried!",
      icon: <CheckCircleOutlined style={{ color: "#00BFA6" }} />,
      content: (
        <>
          <Typography.Paragraph>
            Task retried successfully with uuid{" "}
            <Typography.Text code>{task_id}</Typography.Text>
          </Typography.Paragraph>
        </>
      ),
      onOk: () => {
        window.open(`/task?app=${currentApp}&uuid=${task_id}`, "_self");
      },
      onCancel: () => {
        window.open(`/task?app=${currentApp}&uuid=${task_id}`, "_blank");
      },
      okText: "View",
      cancelText: "View in new tab",
    });
  }

  function revoke(args) {
    console.log(args);
    if (!currentApp) return;
    setRevoking(true);
    return service
      .revokeTaskByID(currentApp, props.task.uuid, args.terminate, args.signal)
      .then(handleAPIResponse)
      .then((result: any) => {
        setIsRevokeModalVisible(false);
        pendingRevocation();
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => setRevoking(false));
  }

  function pendingRevocation() {
    confirm({
      title: "Task pending revocation!",
      icon: <CheckCircleOutlined style={{ color: "#00BFA6" }} />,
      content: (
        <>
          <Typography.Paragraph>
            Task revocation command queued!
          </Typography.Paragraph>
        </>
      ),
      okText: "Ok",
      cancelButtonProps: { style: { display: "none" } },
    });
  }

  function buildCeleryTree() {
    if (!currentApp) return;
    setBuildingTree(true);
    let root_id = props.task.root_id ? props.task.root_id : props.task.uuid;
    return task
        .getCeleryTree(currentApp, currentEnv, root_id)
        .then(handleAPIResponse)
        .then((result: any) => {
          if (!result.workflow)
            message.warning("Task is not part of a workflow!");
          else
            setWorkflow(result)
        }, handleAPIError)
        .catch(handleAPIError)
        .finally(() => setBuildingTree(false));
  }


  function twoWeeksFromNow() {
    return Date.now() - 14 * 24 * 60 * 60 * 1000;
  }

  return (
    <TaskDetails>
      <Modal
        title={
          <>
            <ExclamationCircleOutlined style={{ color: "#d89614" }} /> Do you
            really want to revoke this task?
          </>
        }
        footer={[
          <Button
            form="revokeForm"
            key="submit"
            htmlType="submit"
            loading={revoking}
          >
            Revoke
          </Button>,
        ]}
        onCancel={() => setIsRevokeModalVisible(false)}
        visible={isRevokeModalVisible}
      >
        <Form
          id="revokeForm"
          onFinish={revoke}
          initialValues={{ terminate: false, signal: "SIGTERM" }}
          style={{ marginTop: 10 }}
        >
          <Typography.Paragraph>
            Revoking tasks works by sending a broadcast message to all the
            workers, the workers then keep a list of revoked tasks in memory.
            When a worker receives a task in the list, it will skip executing
            the task.
          </Typography.Paragraph>

          <Input.Group compact style={{ marginTop: 16 }}>
            <FormItem name="terminate" valuePropName="checked">
              <Checkbox>Terminate if started with</Checkbox>
            </FormItem>
            <FormItem name="signal">
              <Select style={{ width: 100 }}>
                <Option value="SIGTERM">SIGTERM</Option>
                <Option value="SIGKILL">SIGKILL</Option>
              </Select>
            </FormItem>
          </Input.Group>

          <Typography.Paragraph type="secondary">
            The worker won’t terminate an already executing task unless the
            terminate option is set.
          </Typography.Paragraph>

          <Divider />

          <Row justify="start" style={{ width: "100%" }}>
            <Typography.Text type="secondary">
              <Typography.Text strong type="warning">
                Caveats:
              </Typography.Text>

              <ul>
                <li>
                  When a worker starts up it will synchronize revoked tasks with
                  other workers in the cluster unless you have disabled
                  synchronization using worker arg
                  <Typography.Text code>--without-mingle</Typography.Text>.
                </li>
                <li>
                  If The list of revoked tasks is in-memory and if all workers
                  restart the list of revoked ids will also vanish. If you want
                  to preserve this list between restarts you need to specify a
                  file for these to be stored in by using the{" "}
                  <Typography.Text code>–statedb</Typography.Text> argument to
                  celery worker.
                </li>
              </ul>
            </Typography.Text>
          </Row>
        </Form>
      </Modal>

      {/* Header */}

      <Row justify="space-between">
        <Col>
          {buildTag(props.task.state, props.task)}{" "}
          {adaptTime(props.task.timestamp)}
        </Col>
        <Col>
          <Space>
            {!TerminalStates.includes(props.task.state) && (
              <Button
                onClick={() => setIsRevokeModalVisible(true)}
                loading={revoking}
                ghost
                danger
              >
                Revoke
              </Button>
            )}
            {TerminalStates.includes(props.task.state) && (
              <Button
                onClick={handleRetryTask}
                loading={retrying}
                ghost
                type="primary"
              >
                Retry
              </Button>
            )}
            <Tag>{`${props.task.events_count} EVENTS`}</Tag>
            <Text copyable={{ text: window.location.href }} strong>
              LINK
            </Text>
            <a
                href={`https://app.datadoghq.com/apm/traces?query=%40celery.correlation_id%3A${props.task.uuid}%20&start=${twoWeeksFromNow()}&end=${Date.now()}&paused=false&historicalData=true`}
                target="_blank"
                rel="noopener noreferrer"
                style={{color: "orchid"}}
            >
              Datadog <FundFilled />
            </a>
          </Space>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="basic"
        tabBarExtraContent={
          props.loading !== undefined && (
            <Space>
              <Typography.Text code>
                {" "}
                {props.loading ? (
                  <SyncOutlined spin />
                ) : (
                  <LoadingOutlined />
                )}{" "}
                Refreshes every 5 seconds
              </Typography.Text>
            </Space>
          )
        }
      >
        {/* Basic */}
        <TabPane tab="Basic" key="basic">
          <List size="small">
            <List.Item key="uuid">
              <List.Item.Meta title="UUID" description={props.task.uuid} />
            </List.Item>
            <List.Item key="name">
              <List.Item.Meta
                title="Name"
                description={
                  props.task.name ? (
                    props.task.name
                  ) : (
                    <Text strong style={{ color: "#d89614" }}>
                      Task name not yet received
                    </Text>
                  )
                }
              />
            </List.Item>
            <List.Item key="runtime">
              <List.Item.Meta
                title="Runtime"
                description={props.task.runtime || "-"}
              />
            </List.Item>
            <List.Item key="args">
              <List.Item.Meta title="Args" description={props.task.args} />
            </List.Item>
            <List.Item key="kwargs">
              <List.Item.Meta
                title="Keyword args"
                description={props.task.kwargs || "-"}
              />
            </List.Item>
            <List.Item key="result">
              <List.Item.Meta
                title="Result"
                description={props.task.result || "-"}
              />
            </List.Item>
          </List>
        </TabPane>
        {/* Log */}
        <TabPane tab="Log" key="log">
          <List size="small">
            <List.Item key="sent">
              <List.Item.Meta
                title="Queued"
                description={adaptTime(props.task.queued_at)}
              />
            </List.Item>
            <List.Item key="received">
              <List.Item.Meta
                title="Received"
                description={adaptTime(props.task.received_at)}
              />
            </List.Item>
            <List.Item key="started">
              <List.Item.Meta
                title="Started"
                description={adaptTime(props.task.started_at)}
              />
            </List.Item>
            <List.Item key="succeeded">
              <List.Item.Meta
                title="Succeeded"
                description={adaptTime(props.task.succeeded_at)}
              />
            </List.Item>
            <List.Item key="retried">
              <List.Item.Meta
                title="Retried"
                description={adaptTime(props.task.retried_at)}
              />
            </List.Item>
            <List.Item key="failed">
              <List.Item.Meta
                title="Failed"
                description={adaptTime(props.task.failed_at)}
              />
            </List.Item>
            <List.Item key="rejected">
              <List.Item.Meta
                title="Rejected"
                description={adaptTime(props.task.rejected_at)}
              />
            </List.Item>
            <List.Item key="revoked">
              <List.Item.Meta
                title="Revoked"
                description={adaptTime(props.task.revoked_at)}
              />
            </List.Item>
            <List.Item key="eta">
              <List.Item.Meta
                title="ETA"
                description={adaptTime(props.task.eta)}
              />
            </List.Item>
            <List.Item key="expires">
              <List.Item.Meta
                title="Expires"
                description={adaptTime(props.task.expires)}
              />
            </List.Item>
            <List.Item key="last_event">
              <List.Item.Meta
                title="Last Event"
                description={adaptTime(props.task.timestamp)}
              />
            </List.Item>
          </List>
        </TabPane>
        {/* Routing */}
        <TabPane tab="Routing" key="routing">
          <List size="small">
            <List.Item key="client">
              <List.Item.Meta
                title="Client"
                description={props.task.client || "-"}
              />
            </List.Item>
            <List.Item key="worker">
              <List.Item.Meta
                title="Worker"
                description={
                  props.task.worker ? (
                    <a href={`/workers/?hostname=${props.task.worker}`}>
                      {props.task.worker}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
            </List.Item>
            <List.Item key="exchange">
              <List.Item.Meta
                title="Exchange"
                description={props.task.exchange || "-"}
              />
            </List.Item>
            <List.Item key="routing_key">
              <List.Item.Meta
                title="Routing Key"
                description={props.task.routing_key || "-"}
              />
            </List.Item>
            <List.Item key="queue">
              <List.Item.Meta
                title="Queue"
                description={props.task.queue || "-"}
              />
            </List.Item>
            <List.Item key="clock">
              <List.Item.Meta title="Clock" description={props.task.clock} />
            </List.Item>
          </List>
        </TabPane>
        {/* Relation */}
        <TabPane tab="Relation" key="relation">
          <List size="small">
            <List.Item key="root">
              <List.Item.Meta
                title="Root"
                description={
                  props.task.root_id ? (
                    <a
                      target="_blank"
                      href={`/task/?app=${currentApp}&uuid=${props.task.root_id}`}
                    >
                      {`<${props.task.root_id}>`}
                    </a>
                  ) : (
                    "SELF"
                  )
                }
              />
            </List.Item>
            <List.Item key="parent">
              <List.Item.Meta
                title="Parent"
                description={
                  props.task.parent_id ? (
                    <a
                      target="_blank"
                      href={`/task/?app=${currentApp}&uuid=${props.task.parent_id}`}
                    >
                      {`<${props.task.parent_id}>`}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
            </List.Item>
          </List>
          <Card
              style={{marginTop: 16}}
              loading={buildingTree}
              bodyStyle={{height: 400}}
              title={<Space><ApartmentOutlined/> <span>Celery Workflow</span> </Space>}
              size={"small"}
              extra={[
                <Button disabled={buildingTree}
                        loading={buildingTree}
                        size={"small"}
                        ghost
                        type="primary"
                        onClick={buildCeleryTree}>
                  {workflow ? "Refresh": "Build"}
                </Button>
              ]}
              actions={workflow ? [
                <Space><NodeIndexOutlined key="executions" /><span>{workflow.total} Tasks</span></Space>,
                <Space><PlayCircleOutlined key="start_time" /><span>{adaptTime(workflow.start_time)}</span></Space>,
                <Space><FieldTimeOutlined key="duration" /><span>{Math.ceil(workflow.duration/60000)} min</span></Space>,
              ]: []}
          >
            <Row>
              <Col span={12}>
                <Tree
                    treeData={workflow ? workflow.workflow : null}
                    height={350}
                    defaultExpandAll={false}
                    showLine={true}
                    defaultExpandedKeys={[props.task.uuid]}
                    defaultSelectedKeys={[props.task.uuid]}
                    onSelect={(selectedKeys,info)=>{
                      window.open(
                          `/task?app=${currentApp}&env=${currentEnv}&uuid=${info.node.key}`,
                          "_blank"
                      );
                    }}
                    titleRender={(nodeData) => {
                      return <>{STATES_ICONS_MAP[nodeData['state']]} <span>{nodeData.title}</span></>
                    }}
                />
              </Col>
              <Col span={12}>
                <Row style={{ height: "350px", width:"100%" }}>
                  <LeekPie data={workflow ? workflow.stats: []} theme={currentTheme} />
                </Row>
              </Col>
            </Row>
          </Card>

        </TabPane>
        {/* Trace */}
        <TabPane tab="Trace" key="trace" disabled={!props.task.exception}>
          <List size="small">
            <List.Item key="retries">
              <List.Item.Meta
                title="Retries"
                description={props.task.retries || "-"}
              />
            </List.Item>
            <List.Item key="error_type">
              <List.Item.Meta
                title="Error Type"
                description={props.task.error?.type || "-"}
              />
            </List.Item>
            <List.Item key="error_message">
              <List.Item.Meta
                  title="Error Message"
                  description={props.task.error?.message || "-"}
              />
            </List.Item>
            <List.Item key="Stacktrace">
              <List.Item.Meta
                style={{ width: "100%" }}
                title="Stacktrace"
                description={
                  props.task.trace?.raw && (
                    <SyntaxHighlighter style={atelierCaveDark}>
                      {props.task.trace.raw}
                    </SyntaxHighlighter>
                  )
                }
              />
            </List.Item>
          </List>
        </TabPane>
        {/* Revocation */}
        <TabPane
          tab="Revocation"
          key="revocation"
          disabled={props.task.state !== "REVOKED"}
        >
          <List size="small">
            <List.Item key="expired">
              <List.Item.Meta
                title="Expired"
                description={props.task.expired ? "Yes" : "No"}
              />
            </List.Item>
            <List.Item key="terminated">
              <List.Item.Meta
                title="Terminated"
                description={props.task.terminated ? "Yes" : "No"}
              />
            </List.Item>
            <List.Item key="signum">
              <List.Item.Meta
                title="Signal Number"
                description={props.task.signum || "-"}
              />
            </List.Item>
          </List>
        </TabPane>
        {/* Revocation */}
        <TabPane
          tab="Rejection"
          key="rejection"
          disabled={props.task.state !== "REJECTED"}
        >
          <List size="small">
            <List.Item key="rejected">
              <List.Item.Meta title="Rejected" description="Yes" />
            </List.Item>
            <List.Item key="terminated">
              <List.Item.Meta
                title="Requeue"
                description={props.task.requeue ? "Yes" : "No"}
              />
            </List.Item>
          </List>
        </TabPane>
      </Tabs>
    </TaskDetails>
  );
};
