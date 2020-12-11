import React, {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet'
import {Card, Col, Row, Empty} from 'antd'
import TimeFilter from "../components/filters/TaskTimeFilter"
import {useApplication} from "../context/ApplicationProvider"

const IssuesPage = () => {

    const {currentApp, currentEnv} = useApplication();
    const [timeFilters, setTimeFilters] = useState<any>({
        timestamp_type: "timestamp",
        interval_type: "at",
        past_time: 900000
    });


    useEffect(() => {
        if (!currentApp) return;
    }, [currentApp, currentEnv, timeFilters]);

    return (
        <>
            <Helmet
                title="Issues"
                meta={[
                    {name: 'description', content: 'Tasks issues'},
                    {name: 'keywords', content: 'celery, tasks'},
                ]}
            >
                <html lang="en"/>
            </Helmet>

            <Row align="middle" style={{textAlign: "center"}}>
                <TimeFilter timeFilter={timeFilters} onTimeFilterChange={setTimeFilters}/>
            </Row>

            <Row justify="center" style={{width: "100%", marginTop: 13}}>

            </Row>
        </>
    )
};

export default IssuesPage
