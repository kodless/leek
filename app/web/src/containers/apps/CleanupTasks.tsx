import React, { useEffect, useState } from "react";
import { Row, Col, Card, Typography, Table, Empty, Space, Radio } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

import CleanupTasksData from "../../components/data/CleanupTasksData";

import { ApplicationService } from "../../api/application";
import { handleAPIError, handleAPIResponse } from "../../utils/errors";

const Text = Typography.Text;

const CleanupTasks = (props) => {
  const service = new ApplicationService();
  const [tasksLoading, setTasksLoading] = useState<boolean>();
  const [tasksDetails, setTasksDetails] = useState<any>("");
  const [tasksSummary, setTasksSummary] = useState<any>("");

  const buildTasksSummary = () => {
    if (!(tasksDetails)) return;
    setTasksSummary(
      tasksDetails.map((task: any) => {
        return {
          id: task.id,
          total: task.status.total,
          deleted: task.status.deleted,
          start_time: task.start_time_in_millis,
          running_time: task.running_time_in_nanos,
        };
      })
    );
  };

  useEffect(() => {
    listCleanupTasks();
  }, [props.selectedApp]);

  function listCleanupTasks() {
    if (props.selectedApp) {
      setTasksLoading(true);
      service
        .listCleanupTasks(props.selectedApp.app_name)
        .then(handleAPIResponse)
        .then((result: any) => {
          setTasksDetails(result);
        }, handleAPIError)
        .catch(handleAPIError)
        .finally(() => {
          setTasksLoading(false);
        });
    }
  }

  useEffect(() => {
      console.log(tasksDetails)
    buildTasksSummary();
  }, [tasksDetails]);

  return (
    <Row style={{ width: "100%" }}>
      <Card
        size="small"
        style={{ width: "100%" }}
        bodyStyle={{ paddingBottom: 0, paddingRight: 0, paddingLeft: 0 }}
        title={
          <Row justify="space-between">
            <Col>
              <Space>
                <DeleteOutlined />
                <Text strong>Cleanup Tasks</Text>
              </Space>
            </Col>
          </Row>
        }
      >
        <Table
          dataSource={tasksSummary}
          columns={CleanupTasksData()}
          showHeader={true}
          pagination={false}
          size="small"
          rowKey="name"
          style={{ width: "100%" }}
          scroll={{ x: "100%" }}
          loading={tasksLoading}
          locale={{
            emptyText: (
              <div style={{ textAlign: "center" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      No <a href="#API">Cleanup Tasks</a> found
                    </span>
                  }
                />
              </div>
            ),
          }}
        />
      </Card>
    </Row>
  );
};

export default CleanupTasks;
