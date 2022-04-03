import React from "react";
import { Link } from "gatsby";
import { Row, Result, Button } from "antd";

const ServiceUnavailable = () => {
  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
      <Result
        status="warning"
        title="Network Error"
        subTitle="Maybe the backend is down or you are offline!"
        extra={
          <Link to="/">
            <Button type="primary">Retry</Button>
          </Link>
        }
      />
    </Row>
  );
};

export default ServiceUnavailable;
