import React from 'react'
import {Helmet} from 'react-helmet'
import {Breadcrumb} from 'antd';


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

            <Breadcrumb style={{margin: '16px 0'}}>
                <Breadcrumb.Item>User</Breadcrumb.Item>
                <Breadcrumb.Item>Bill</Breadcrumb.Item>
                <Breadcrumb.Item>fff</Breadcrumb.Item>
            </Breadcrumb>

            <div className="site-layout-background" style={{padding: 24, minHeight: 360}}>
                Bill is a cat.
            </div>
        </>
    )
};

export default IndexPage
