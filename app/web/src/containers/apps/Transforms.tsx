import React, { useEffect, useState } from "react";
import {Row, Col, Card, Typography, Table, Empty, Space, message} from "antd";
import { InteractionOutlined } from "@ant-design/icons";

import TransformData from "../../components/data/TransformsData";

import { ApplicationService } from "../../api/application";
import { handleAPIError, handleAPIResponse } from "../../utils/errors";

const Text = Typography.Text;

const Transforms = (props) => {
  const service = new ApplicationService();
  const [transformsLoading, setTransformsLoading] = useState<boolean>();
  const [transforms, setTransforms] = useState<any>("");
  const [loading, setLoading] = useState<boolean>();

  useEffect(() => {
    listTransforms();
  }, [props.selectedApp]);

  function listTransforms() {
    if (props.selectedApp) {
      setTransformsLoading(true);
      service
        .listTransforms(props.selectedApp.app_name)
        .then(handleAPIResponse)
        .then((result: any) => {
            console.log(result);
          setTransforms(result);
        }, handleAPIError)
        .catch(handleAPIError)
        .finally(() => {
            setTransformsLoading(false);
        });
    }
  }

    function doStartTransform(transform_id) {
        setLoading(true);
        service
            .startTransform(props.selectedApp.app_name)
            .then(handleAPIResponse)
            .then((_: any) => {
                message.info("Transform started!");
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => {
                setLoading(false);
            });
    }

  return (
    <Row style={{ width: "100%", marginBottom: "16px" }}>
      <Card
        size="small"
        style={{ width: "100%" }}
        bodyStyle={{ paddingBottom: 0, paddingRight: 0, paddingLeft: 0 }}
        title={
          <Row justify="space-between">
            <Col>
              <Space>
                <InteractionOutlined />
                <Text strong>Transforms</Text>
              </Space>
            </Col>
          </Row>
        }
      >
        <Table
          dataSource={transforms}
          columns={TransformData({
              handleStartTransform: doStartTransform,
              loading: loading
          })}
          showHeader={true}
          pagination={false}
          size="small"
          rowKey="name"
          style={{ width: "100%" }}
          scroll={{ x: "100%" }}
          loading={transformsLoading}
          locale={{
            emptyText: (
              <div style={{ textAlign: "center" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      No <a href="#API">Transforms</a> found
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

export default Transforms;
