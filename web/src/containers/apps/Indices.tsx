import React, {useEffect, useState} from 'react'
import {Row, Col, Card, Typography, Table, Empty, Space} from 'antd'
import {BellOutlined} from "@ant-design/icons";

import IndicesData from "../../components/app/IndicesData";

import {ApplicationSearch} from "../../api/application";
import {handleAPIError, handleAPIResponse} from "../../utils/errors";


const Text = Typography.Text;

const Indices = (props) => {

    const application = new ApplicationSearch();
    const [indicesLoading, setIndicesLoading] = useState<boolean>();


    useEffect(() => {
        listIndices();
    }, [props.selectedApp]);

    function listIndices() {
        if (props.selectedApp) {
            setIndicesLoading(true);
            application.listApplicationIndices(props.selectedApp.app_name)
                .then(handleAPIResponse)
                .then((result: any) => {
                    console.log(result)
                }, handleAPIError)
                .catch(handleAPIError)
                .finally(() => {
                    setIndicesLoading(false);
                });
        }
    }

    return (
        <Row style={{width: "100%"}}>
            <Card size="small" style={{width: "100%"}}
                  bodyStyle={{paddingBottom: 0, paddingRight: 0, paddingLeft: 0}}
                  title={<Row justify="space-between">
                      <Col>
                          <Space>
                              <BellOutlined/>
                              <Text strong>Indices</Text>
                          </Space>
                      </Col>
                  </Row>}
            >
                <Table dataSource={props.selectedApp.fo_triggers}
                       columns={IndicesData()}
                       showHeader={false}
                       pagination={false}
                       size="small"
                       rowKey="id"
                       style={{width: "100%"}}
                       scroll={{x: "100%"}}
                       loading={indicesLoading}
                       locale={{
                           emptyText: <div style={{textAlign: 'center'}}>
                               <Empty
                                   image={Empty.PRESENTED_IMAGE_SIMPLE}
                                   description={
                                       <span>No <a href="#API">indices</a> found</span>
                                   }
                               />
                           </div>
                       }}
                />
            </Card>
        </Row>
    )
};

export default Indices
