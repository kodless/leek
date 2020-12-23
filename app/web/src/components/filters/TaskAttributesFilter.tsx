import React from "react";
import {Card, Input, Row, Select, Button, Form, Badge, InputNumber} from "antd";

import {useApplication} from "../../context/ApplicationProvider";

const {Option} = Select;
const FormItem = Form.Item;

interface TasksFilterContextData {
    onFilter(value: {});
}

const TaskAttributesFilter: React.FC<TasksFilterContextData> = (props: TasksFilterContextData) => {
    const {seenTasks, seenWorkers, seenTaskStates, seenRoutingKeys, seenQueues} = useApplication();
    const [form] = Form.useForm();

    // UI Callbacks
    function handleReset() {
        form.resetFields();
        form.submit()
    }

    function onSubmit(filters) {
        props.onFilter(filters)
    }

    return (
        <Card title={
            <Button size="small" type="primary" onClick={form.submit}>
                Filter
            </Button>
        } size={"small"}
              extra={<Button onClick={handleReset} size="small">Reset</Button>}
              style={{width: "100%"}}
        >
            <Form style={{width: "100%"}} form={form} onFinish={onSubmit}
                  initialValues={{runtime_op: "gte", retries_op: "gte"}}>
                <Row>
                    <FormItem name="uuid" style={{width: "100%"}}>
                        <Input placeholder="uuid"/>
                    </FormItem>
                </Row>
                <Row>
                    <FormItem name="name" style={{width: "100%"}}>
                        <Select placeholder="Name"
                                style={{width: "100%"}}
                                allowClear
                                showSearch
                                dropdownMatchSelectWidth={false}>
                            {
                                seenTasks.map((task, key) =>
                                    <Option key={task.key} value={task.key}>{task.key} <Badge count={task.doc_count}
                                                                                              overflowCount={999}/></Option>
                                )
                            }
                        </Select>
                    </FormItem>
                </Row>
                <Row>
                    <FormItem name="state" style={{width: "100%"}}>
                        <Select placeholder="State"
                                style={{width: "100%"}}
                                allowClear>
                            {
                                seenTaskStates.map((state, key) =>
                                    <Option key={state.key} value={state.key}>{state.key} <Badge count={state.doc_count}
                                                                                                 overflowCount={999}/></Option>
                                )
                            }
                        </Select>
                    </FormItem>
                </Row>
                <Row>
                    <FormItem name="routing_key" style={{width: "100%"}}>
                        <Select placeholder="Routing key"
                                style={{width: "100%"}}
                                allowClear>
                            {
                                seenRoutingKeys.map((state, key) =>
                                    <Option key={state.key} value={state.key}>{state.key} <Badge count={state.doc_count}
                                                                                                 overflowCount={999}/></Option>
                                )
                            }
                        </Select>
                    </FormItem>
                </Row>
                <Row>
                    <FormItem name="queue" style={{width: "100%"}}>
                        <Select placeholder="Queue"
                                style={{width: "100%"}}
                                allowClear>
                            {
                                seenQueues.map((state, key) =>
                                    <Option key={state.key} value={state.key}>{state.key} <Badge count={state.doc_count}
                                                                                                 overflowCount={999}/></Option>
                                )
                            }
                        </Select>
                    </FormItem>
                </Row>
                <Row>
                    <FormItem name="worker" style={{width: "100%"}}>
                        <Select placeholder="Worker"
                                style={{width: "100%"}}
                                allowClear>
                            {
                                seenWorkers.map((worker, key) =>
                                    <Option key={worker.key} value={worker.key}>{worker.key} <Badge
                                        count={worker.doc_count} overflowCount={999}/></Option>
                                )
                            }
                        </Select>
                    </FormItem>
                </Row>
                <Row>
                    <Input.Group compact>
                        <FormItem name="runtime_op" style={{width: "30%"}}>
                            <Select style={{width: '100%'}}>
                                <Option value="gte">{"gte"}</Option>
                                <Option value="lte">{"lte"}</Option>
                            </Select>
                        </FormItem>
                        <FormItem name="runtime" style={{width: "70%"}}>
                            <InputNumber style={{width: '100%'}}
                                         min={0} max={10} step={0.0001}
                                         placeholder="Runtime"
                            />
                        </FormItem>

                    </Input.Group>
                </Row>
                <Row>
                    <Input.Group compact>
                        <FormItem name="retries_op" style={{width: "30%"}}>
                            <Select style={{width: '100%'}}>
                                <Option value="gte">{"gte"}</Option>
                                <Option value="lte">{"lte"}</Option>
                            </Select>
                        </FormItem>
                        <FormItem name="retries" style={{width: "70%"}}>
                            <InputNumber style={{width: '100%'}}
                                         min={0} max={1000} step={1}
                                         placeholder="Retries"
                            />
                        </FormItem>
                    </Input.Group>
                </Row>
                <Row>
                    <FormItem name="exception" style={{width: "100%"}}>
                        <Input placeholder="Exception"/>
                    </FormItem>
                </Row>
                <Row>
                    <FormItem name="traceback" style={{width: "100%"}}>
                        <Input placeholder="Traceback"/>
                    </FormItem>
                </Row>
                <Row>
                    <FormItem name="args" style={{width: "100%"}}>
                        <Input placeholder="args"/>
                    </FormItem>
                </Row>
                <Row>
                    <FormItem name="kwargs" style={{width: "100%"}}>
                        <Input placeholder="kwargs"/>
                    </FormItem>
                </Row>
                <Row>
                    <FormItem name="result" style={{width: "100%"}}>
                        <Input placeholder="Result"/>
                    </FormItem>
                </Row>
            </Form>
        </Card>
    );
};

export default TaskAttributesFilter