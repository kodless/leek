import React from 'react'
import {Layout, Affix, Typography} from 'antd'

import env from "../../utils/vars";
import Header from './Header'

const {Content} = Layout;
const Text = Typography.Text;

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
                <Affix style={{position:'fixed',bottom:13,right:50}}>
                    <Text code>Leek v{env.LEEK_VERSION}</Text> - <a href="https://tryleek.com" target="_blank" rel="noopener norefferer">Docs</a>
                </Affix>
            </Content>
        </Layout>
    )
}

export default AppLayout
