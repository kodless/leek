import React, {useState, useEffect} from "react";
import {Helmet} from 'react-helmet'
import {StringParam, useQueryParam} from "use-query-params";
import {Row, Drawer, Button, Col, Table, Radio, message, Empty, Card} from 'antd';
import {SyncOutlined} from '@ant-design/icons';

import WorkerDataColumns from "../components/data/WorkerData";
import WorkerDetailsDrawer from "../containers/workers/WorkerDetailsDrawer";

import {useApplication} from "../context/ApplicationProvider";
import {WorkerService} from "../api/worker";
import {handleAPIError, handleAPIResponse} from "../utils/errors"
import {fixPagination} from "../utils/pagination";


const WorkersPage = () => {
    // STATE
    const service = new WorkerService();
    const {currentApp} = useApplication();
    const [qpHostname, setQPHostname] = useQueryParam("hostname", StringParam);

    // Data
    const columns = WorkerDataColumns();
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>();
    const [currentWorker, setCurrentWorker] = useState({});
    const [pagination, setPagination] = useState<any>({pageSize: 10, current: 1});

    // Controls
    const [stateFilter, setStateFilter] = useState<string | null>(null);

    // UI
    const [workerDetailsVisible, setDetailsVisible] = useState(false);

    /** =======================
     *  Calls
     ---------------------- **/
    function filterWorkers(pager = {current: 1, pageSize: 10}) {
        if (!currentApp) return;
        setLoading(true);
        let from_ = (pager.current - 1) * pager.pageSize;
        service.filter(currentApp, null, pager.pageSize, from_, stateFilter)
            .then(handleAPIResponse)
            .then((result: any) => {
                // Prepare pagination
                let p = fixPagination(result.hits.total.value, pager, filterWorkers);
                if (p) setPagination(p);
                else return;
                // Result
                let workersList: { any }[] = [];
                result.hits.hits.forEach(function (hit) {
                    workersList.push(hit._source)
                });
                setWorkers(workersList);
            }, handleAPIError)
            .catch(handleAPIError)
            .finally(() => setLoading(false));
    }

    function getWorkerByHostname(hostname: string) {
        if (!currentApp) return;
        service.getById(currentApp, hostname)
            .then(handleAPIResponse)
            .then((result: any) => {
                if (result.hits.total == 0) {
                    message.warning("Worker not found maybe it's expired and got deleted from memory");
                    return;
                }
                handleShowWorkerDetails(result.hits.hits[0]._source);
            }, handleAPIError)
            .catch(handleAPIError);
    }

    /** ======================
     *  Hooks
     ---------------------- */
    useEffect(() => {
        refresh(pagination)
    }, [stateFilter, currentApp]);

    useEffect(() => {
        if (qpHostname) {
            getWorkerByHostname(qpHostname)
        }
    }, []);

    /** ======================
     *  UI Callbacks
     ---------------------- */
    function handleWorkerDetailsDrawerClosed() {
        setDetailsVisible(false);
        setQPHostname(undefined)
    }

    function handleRefreshWorkers() {
        refresh()
    }

    function handleShowTotal(total) {
        return `Total of ${total} workers`;
    }

    function handleTableChange(pagination, filters, sorter) {
        refresh(pagination)
    }

    function handleStateFilterChange(e) {
        setStateFilter(e.target.value);
    }

    function handleShowWorkerDetails(worker) {
        setCurrentWorker(worker);
        setQPHostname(worker.hostname);
        setDetailsVisible(true)
    }

    function refresh(pager = {current: 1, pageSize: 10}) {
        setWorkers([]);
        filterWorkers(pager)
    }

    return (
        <>
            <Helmet
                title="Workers"
                meta={[
                    {name: 'description', content: 'List of workers'},
                    {name: 'keywords', content: 'celery, workers'},
                ]}
            >
                <html lang="en"/>
            </Helmet>
            <Row>
                <Card
                    style={{width: "100%"}}
                    bodyStyle={{paddingBottom: 0, paddingRight: 0, paddingLeft: 0}}
                    title={
                        <Row align="middle">
                            <Col span={21}>
                                <Radio.Group onChange={handleStateFilterChange} defaultValue="HEARTBEAT" size="small"
                                             style={{fontWeight: 400}}>
                                    <Radio.Button value="" style={{fontStyle: "normal"}}>ANY</Radio.Button>
                                    <Radio.Button value="HEARTBEAT">HEARTBEAT</Radio.Button>
                                    <Radio.Button value="ONLINE">ONLINE</Radio.Button>
                                    <Radio.Button value="OFFLINE">OFFLINE</Radio.Button>
                                </Radio.Group>
                            </Col>

                            <Col span={3}>
                                <Button onClick={handleRefreshWorkers} icon={<SyncOutlined/>}
                                        style={{float: "right"}} size="small"/>
                            </Col>
                        </Row>
                    }
                    size="small"
                >
                    <Table dataSource={workers}
                           columns={columns}
                           loading={loading}
                           size="small"
                           rowKey="hostname"
                           style={{width: "100%"}}
                           scroll={{x: "100%"}}
                           showHeader={false}
                           pagination={{...pagination, showTotal: handleShowTotal}}
                           onChange={handleTableChange}
                           locale={{
                               emptyText: <div style={{textAlign: 'center'}}>
                                   <Empty
                                       image={Empty.PRESENTED_IMAGE_SIMPLE}
                                       description={
                                           <span>No <a href="#API">workers</a> found</span>
                                       }
                                   />
                               </div>
                           }}
                           onRow={(record, rowIndex) => {
                               return {
                                   onClick: event => {
                                       handleShowWorkerDetails(record)
                                   }
                               };
                           }}
                    />
                </Card>
            </Row>
            <Drawer
                width="50vw"
                placement="right"
                closable={false}
                onClose={handleWorkerDetailsDrawerClosed}
                visible={workerDetailsVisible}
            >
                <WorkerDetailsDrawer worker={currentWorker}/>
            </Drawer>
        </>
    )
};

export default WorkersPage
