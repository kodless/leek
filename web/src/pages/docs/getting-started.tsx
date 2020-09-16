import React from 'react'
import {Helmet} from 'react-helmet'
import {Row} from 'antd'


const IndexPage = () => {
    return (
        <>
            <Helmet
                title="Leek"
                meta={[
                    {name: 'description', content: 'Celery tasks monitoring'},
                    {name: 'keywords', content: 'celery, tasks, flower, rabbitmq'},
                ]}
            >
                <html lang="en"/>
            </Helmet>

            <Row gutter={16} justify="center" align="middle">

            </Row>
        </>
    )
};

export default IndexPage
