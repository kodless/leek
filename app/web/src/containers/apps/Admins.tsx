import React, { useEffect, useState } from "react";
import { Row, Button, Col, Card, Typography, Table, Modal, Form, Input, Empty, Space} from "antd";
import { AppstoreAddOutlined, DeploymentUnitOutlined, BellOutlined} from "@ant-design/icons";

import AdminDataColumns from "../../components/data/AdminData";

import { ApplicationService } from "../../api/application";
import { handleAPIError, handleAPIResponse } from "../../utils/errors";
import { useApplication } from "../../context/ApplicationProvider";

const Text = Typography.Text;
const FormItem = Form.Item;


const Admins = (props) => {
  const [form] = Form.useForm();
  const service = new ApplicationService();
  const { updateApplication } = useApplication();

  const [createAdminModalVisible, setCreateAdminModalVisible] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {}, []);

  function doAddAdmin(admin) {
    setLoading(true);
    service
      .grantApplicationAdmin(props.selectedApp.app_name, admin.email)
      .then(handleAPIResponse)
      .then((application: any) => {
        updateApplication(application);
        props.setSelectedApp(application);
        reset();
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => {
        setLoading(false);
      });
  }

  function doDeleteAdmin(admin_email) {
    setLoading(true);
    service
      .revokeApplicationAdmin(props.selectedApp.app_name, admin_email)
      .then(handleAPIResponse)
      .then((application: any) => {
        updateApplication(application);
        props.setSelectedApp(application);
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => {
        setLoading(false);
      });
  }


  function reset() {
    setCreateAdminModalVisible(false);
    form.resetFields();
  }

  const formItems = (
    <>
      <FormItem
        name="email"
        rules={[
          { required: true, message: "Please input the admin email!" },
          {
            type: "email",
            message: "This field must be a valid email.",
          },
        ]}
      >
        <Input
          prefix={<DeploymentUnitOutlined style={{ fontSize: 13 }} />}
          placeholder="Admin email"
        />
      </FormItem>
    </>
  );

  return (
    <Row style={{ width: "100%", marginBottom: "16px" }}>
      {/*Create Admin*/}
      <Modal
        title={
          <Space>
            <BellOutlined />
            Create Admin
          </Space>
        }
        visible={createAdminModalVisible}
        onCancel={reset}
        footer={[
          <Button key="cancel" size="small" onClick={reset}>
            Cancel
          </Button>,
          <Button
            form="createAdmin"
            key="submit"
            htmlType="submit"
            size="small"
            type="primary"
            loading={loading}
          >
            Create
          </Button>,
        ]}
      >
        <Form
          onFinish={doAddAdmin}
          form={form}
          id="createAdmin"
          initialValues={{ }}
        >
          {formItems}
        </Form>
      </Modal>

      <Card
        size="small"
        style={{ width: "100%" }}
        bodyStyle={{ paddingBottom: 0, paddingRight: 0, paddingLeft: 0 }}
        title={
          <Row justify="space-between">
            <Col>
              <Space>
                <BellOutlined />
                <Text strong>Application admins</Text>
              </Space>
            </Col>
            <Col>
              <Button
                onClick={() => setCreateAdminModalVisible(true)}
                size="small"
                type="primary"
                ghost
                icon={<AppstoreAddOutlined />}
              />
            </Col>
          </Row>
        }
      >
        <Table
          dataSource={props.selectedApp.admins}
          columns={AdminDataColumns({
            handleDeleteAdmin: doDeleteAdmin,
            adminsModifying: loading,
          })}
          showHeader={false}
          pagination={false}
          size="small"
          rowKey="id"
          style={{ width: "100%" }}
          scroll={{ x: "100%" }}
          locale={{
            emptyText: (
              <div style={{ textAlign: "center" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      No <a href="#API">admins</a> found
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

export default Admins;
