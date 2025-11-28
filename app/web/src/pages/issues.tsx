import React, {useCallback, useEffect, useState} from "react";
import { Helmet } from "react-helmet-async";
import { Card, Col, Row, Empty, Table, Button } from "antd";
import { SyncOutlined } from "@ant-design/icons";

import IssueDataColumns from "../components/data/IssueData";
import TimeFilter from "../components/filters/TaskTimeFilter";
import { useApplication } from "../context/ApplicationProvider";
import { IssueService } from "../api/issue";
import { handleAPIError, handleAPIResponse } from "../utils/errors";

const IssuesPage = () => {
  const columns = IssueDataColumns();
  const service = new IssueService();
  const [loading, setLoading] = useState<boolean>();
  const [issues, setIssues] = useState<any>([]);

  const { currentApp, currentEnv } = useApplication();
  const [pagination, setPagination] = useState<any>({
    pageSize: 10,
    current: 1,
  });
  const [timeFilters, setTimeFilters] = useState<any>({
    timestamp_type: "timestamp",
    interval_type: "past",
    offset: 900000,
  });

  // track when children have hydrated from URL
  const [timeFiltersReady, setTimeFiltersReady] = useState(false);

  // ---- Handlers passed to children ----
  const handleTimeFilterChange = useCallback((values: any) => {
      setTimeFilters(values);
      setTimeFiltersReady(true);   // ✅ time filter hydrated
  }, []);

  function filterIssues(pager = { current: 1, pageSize: 10 }) {
    if (!currentApp) return;
    setLoading(true);
    service
      .filter(currentApp, currentEnv, timeFilters)
      .then(handleAPIResponse)
      .then((result: any) => {
        setIssues(
          result.aggregations.exceptions.buckets.map(
            ({ key, doc_count, state }) => {
              let tasksStatesSeries = {
                QUEUED: 0,
                RECEIVED: 0,
                STARTED: 0,
                SUCCEEDED: 0,
                FAILED: 0,
                REJECTED: 0,
                REVOKED: 0,
                RETRY: 0,
                RECOVERED: 0,
                CRITICAL: 0,
              };
              const states = state.buckets.reduce((result, item) => {
                result[item.key] = item.doc_count;
                return result;
              }, tasksStatesSeries);
              return {
                exception: key,
                doc_count: doc_count,
                ...states,
              };
            }
          )
        );
      }, handleAPIError)
      .catch(handleAPIError)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // Don't fire until we know time filters have hydrated from URL
    if (!timeFiltersReady) return;
    refresh(pagination);
  }, [currentApp, currentEnv, timeFilters, timeFiltersReady]);

  // UI Callbacks
  function refresh(pager = { current: 1, pageSize: 10 }) {
    filterIssues(pager);
  }

  function handleShowTotal(total) {
    return `Total of ${total} issues`;
  }

  function handleRefresh() {
    refresh(pagination);
  }

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Issues</title>
        <meta name="description" content="Tasks issues" />
        <meta name="keywords" content="celery, issues" />
      </Helmet>

      <Row justify="center" style={{ width: "100%", marginTop: 13 }}>
        <Card
          bodyStyle={{ paddingBottom: 0, paddingRight: 0, paddingLeft: 0 }}
          size="small"
          style={{ width: "100%" }}
          title={
            <Row align="middle">
              <Col span={3}></Col>
              <Col span={18} style={{ textAlign: "center" }}>
                <TimeFilter
                  onTimeFilterChange={handleTimeFilterChange}
                />
              </Col>
              <Col span={3}>
                <Button
                  size="small"
                  onClick={handleRefresh}
                  icon={<SyncOutlined />}
                  style={{ float: "right" }}
                />
              </Col>
            </Row>
          }
        >
          <Table
            dataSource={issues}
            columns={columns}
            loading={loading}
            pagination={{ ...pagination, showTotal: handleShowTotal }}
            size="small"
            rowKey="exception"
            style={{ width: "100%" }}
            scroll={{ x: "100%" }}
            locale={{
              emptyText: (
                <div style={{ textAlign: "center" }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span>
                        No <a href="#API">issues</a> found
                      </span>
                    }
                  />
                </div>
              ),
            }}
          />
        </Card>
      </Row>
    </>
  );
};

export default IssuesPage;
