import React, { useEffect, useState } from "react";
import { Row, Col, Card, Typography, Table, Empty, Space, Radio } from "antd";
import { NodeIndexOutlined } from "@ant-design/icons";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atelierCaveDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

import IndicesData from "../../components/data/IndicesData";

import { ApplicationService } from "../../api/application";
import { handleAPIError, handleAPIResponse } from "../../utils/errors";

const Text = Typography.Text;

const Indices = (props) => {
  const service = new ApplicationService();
  const [indicesLoading, setIndicesLoading] = useState<boolean>();
  const [indicesDetails, setIndicesDetails] = useState<any>("");
  const [indicesSummary, setIndicesSummary] = useState<any>("");
  const [indicesDetailsVisible, setIndicesDetailsVisible] =
    useState<boolean>(false);

  const buildIndicesSummary = () => {
    if (!(indicesDetails && indicesDetails.indices)) return;
    setIndicesSummary(
      Object.entries(indicesDetails.indices).map(([name, details]: any) => {
        return {
          name: name,
          docs_count: details.primaries.docs.count,
          size: `${Math.ceil(
            details.primaries.store.size_in_bytes / 1000000
          )}mb`,
          index_total: details.primaries.indexing.index_total,
          index_time: `${
            details.primaries.indexing.index_time_in_millis / 1000
          } sec`,
        };
      })
    );
  };

  useEffect(() => {
    listIndices();
  }, [props.selectedApp]);

  function listIndices() {
    if (props.selectedApp) {
      setIndicesLoading(true);
      service
        .listApplicationIndices(props.selectedApp.app_name)
        .then(handleAPIResponse)
        .then((result: any) => {
          setIndicesDetails(result);
        }, handleAPIError)
        .catch(handleAPIError)
        .finally(() => {
          setIndicesLoading(false);
        });
    }
  }

  useEffect(() => {
    buildIndicesSummary();
  }, [indicesDetails]);

  return (
    <Row style={{ width: "100%", marginBottom: "16px" }}>
      <Card
        size="small"
        style={{ width: "100%" }}
        bodyStyle={{ paddingBottom: 0, paddingRight: 0, paddingLeft: 0 }}
        extra={
          <Radio.Group
            onChange={(v) => {
              v.target.value === "SUMMARY"
                ? setIndicesDetailsVisible(false)
                : setIndicesDetailsVisible(true);
            }}
            defaultValue="SUMMARY"
            size="small"
          >
            <Radio.Button value="SUMMARY">SUMMARY</Radio.Button>
            <Radio.Button value="DETAILS">DETAILS</Radio.Button>
          </Radio.Group>
        }
        title={
          <Row justify="space-between">
            <Col>
              <Space>
                <NodeIndexOutlined />
                <Text strong>Indices</Text>
              </Space>
            </Col>
          </Row>
        }
      >
        {!indicesDetailsVisible && (
          <Table
            dataSource={indicesSummary}
            columns={IndicesData()}
            showHeader={true}
            pagination={false}
            size="small"
            rowKey="name"
            style={{ width: "100%" }}
            scroll={{ x: "100%" }}
            loading={indicesLoading}
            locale={{
              emptyText: (
                <div style={{ textAlign: "center" }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span>
                        No <a href="#API">indices</a> found
                      </span>
                    }
                  />
                </div>
              ),
            }}
          />
        )}

        {indicesDetailsVisible && indicesDetails && indicesDetails.indices && (
          <SyntaxHighlighter
            customStyle={{ width: "100%" }}
            style={atelierCaveDark}
            language="json"
          >
            {JSON.stringify(indicesDetails.indices, null, 2)}
          </SyntaxHighlighter>
        )}
      </Card>
    </Row>
  );
};

export default Indices;
