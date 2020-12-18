import React from 'react'
import {Row, Button, Typography, Col} from 'antd'
import {GoogleOutlined} from "@ant-design/icons";


import Image from "../components/Image";
import {useAuth} from "../context/AuthProvider";
import {Link} from "gatsby";


const Title = Typography.Title;

const AuthPage = () => {

    const {login, loading} = useAuth();

    function handleAuth() {
        login()
    }

    return (
        <Row justify="center" align="middle" style={{minHeight: '100vh'}}>

            <Col xxl={12} xl={12} md={12} lg={12} sm={24} xs={24}>
                <Row justify="center" style={{width: "100%", marginBottom: "10px"}}>
                    <Col>
                        <div style={{width: "40px"}}>
                            <Image alt="Logo"/>
                        </div>
                    </Col>
                    <Col><Title level={2}>LEEK</Title></Col>
                </Row>

                <Row justify="center" style={{width: "100%", marginBottom: "26px"}}>
                    <Title>Welcome back!</Title>
                </Row>

                <Row justify="center">
                    <Button onClick={handleAuth} icon={<GoogleOutlined/>} loading={loading}>
                        Sign in with Google
                    </Button>
                </Row>
            </Col>

            <Col xxl={12} xl={12} md={12} lg={12} sm={0} xs={0}
                 style={{backgroundColor: "#00BFA6", minHeight: "100vh"}}>
                <Row justify="center" style={{width: "100%", minHeight: "100vh"}} align="middle">
                    <Title type="secondary">Make Leek Great Again</Title>
                </Row>
            </Col>

        </Row>

    )
};

export default AuthPage
