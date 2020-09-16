import React from 'react'
import Header from './Header'
import {Layout} from 'antd'

const {Content} = Layout;

export function AppLayout({children}: any) {
    return (
        <Layout>
            <Header/>
            <Content
                style={{
                    padding: '0 50px',
                    marginTop: 64
                }}
            >
                {children}
            </Content>
        </Layout>
    )
}

export default AppLayout
