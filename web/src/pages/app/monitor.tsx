import React from 'react'
import {Helmet} from 'react-helmet'
import {Row} from 'antd'

const MonitorPage = () => {

    return (
        <>
            <Helmet
                title="Monitor"
                meta={[
                    {name: 'description', content: 'Tasks monitor'},
                    {name: 'keywords', content: 'celery, tasks'},
                ]}
            >
                <html lang="en"/>
            </Helmet>

            <Row gutter={16} justify="center" align="middle">

            </Row>
        </>
    )
};

export default MonitorPage
