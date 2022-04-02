import React, {useEffect, useState} from 'react'
import {Row, Button, Typography, Col, Image} from 'antd'
import {GoogleOutlined} from "@ant-design/icons";


import {useAuth} from "../context/AuthProvider";
import {getJokes} from "../data/jokes";


const Title = Typography.Title;
const jokes = getJokes();

const AuthPage = () => {

    const {login, loading} = useAuth();
    const [currentJokeIndex, setCurrentJokeIndex] = useState<number>(0);

    function handleAuth() {
        login()
    }

    function showNextJoke() {
        if (currentJokeIndex == (jokes.length - 1))
            setCurrentJokeIndex(0);
        else
            setCurrentJokeIndex(currentJokeIndex + 1);
    }

    useEffect(() => {
        // Stop refreshing metadata
        const timeout = setTimeout(() => {
            showNextJoke()
        }, 5000);

        return () => {
            clearTimeout(timeout);
        }
    }, [currentJokeIndex]);

    return (
        <Row justify="center" align="middle" style={{minHeight: '100vh'}}>

            <Col xxl={12} xl={12} md={12} lg={12} sm={24} xs={24}>
                <Row justify="center" style={{width: "100%", marginBottom: "10px"}}>
                    <Col>
                        <div style={{width: "40px"}}>
                            <Image alt="Logo" style={{maxHeight: "100%"}} src="/leek.png" preview={false}/>
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
                <Row justify="center" style={{width: "100%", minHeight: "100vh", padding: 30}} align="middle">
                    <Row>
                        <Row justify="center"  style={{width: "100%", marginBottom: 24}}>
                            <Image
                                width={200}
                                src={`/veggies/${jokes[currentJokeIndex].img}`}
                            />
                        </Row>
                        <Row justify="center" style={{width: "100%"}}>
                            <Title style={{textAlign: "center", color: "#444"}}>{jokes[currentJokeIndex].joke}</Title>
                        </Row>
                    </Row>
                </Row>
            </Col>

        </Row>

    )
};

export default AuthPage
