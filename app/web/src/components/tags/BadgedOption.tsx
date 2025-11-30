import React from "react";
import { Badge, Col, Row, Select } from "antd";

const Option = Select.Option;
const overflowCount = 999999;
const badgeStyle = {
  backgroundColor: "#00BFA6",
  color: "#333",
  fontWeight: 600,
};

export const badgedOption = (item, represent_value=null, with_value=null, count=true) => {
  return (
    <Option key={item.key} value={item.key}>
      <Row style={{ width: "100%" }} justify="space-between">
        <Col>{item.key === represent_value ? with_value : item.key}</Col>
        <Col>
          <Badge
            count={count ? item.doc_count : null}
            overflowCount={overflowCount}
            size="small"
            style={badgeStyle}
          />
        </Col>
      </Row>
    </Option>
  );
};
