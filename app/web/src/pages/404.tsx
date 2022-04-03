import React from "react";
import { Link } from "gatsby";
import { Row, Result, Button } from "antd";

const NotFound = () => {
  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Link to="/">
            <Button type="primary">Back Home</Button>
          </Link>
        }
      />
    </Row>
  );
};

export default NotFound;
