import React from 'react'
import {Helmet} from 'react-helmet'

import Applications from "../containers/apps/Applications";

const ApplicationsPage = () => {

    return (
        <>
            <Helmet
                title="Applications"
                meta={[
                    {name: 'description', content: 'Events metrics'},
                    {name: 'keywords', content: 'celery, tasks'},
                ]}
            >
                <html lang="en"/>
            </Helmet>
            <Applications/>
        </>
    )
};

export default ApplicationsPage
