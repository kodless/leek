import Layout from "@theme/Layout";
import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Link from "@docusaurus/Link";

const itemStyle = {
    width: "31%", margin: "1%", padding: "10px", backgroundColor: "var(--ifm-footer-background-color)",
    border: "1px solid",
    borderColor: "#777",
};

export default () => {
    return (
        <Layout>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    flexDirection: "column",
                    margin: "2rem auto",
                    marginLeft: 70,
                    marginRight: 70,
                }}
            >
                <h2
                    style={{
                        padding: "5px 0px",
                        fontSize: "23px",
                        color: "var(--ifm-link-color)",
                    }}
                >
                    Celery Tasks Monitoring Tool
                </h2>
                <h1
                    style={{
                        padding: "5px 0px",
                        fontSize: "45px",
                    }}
                >
                    The only celery tasks monitoring tool that can catch them all.
                </h1>
                <h3
                    style={{
                        padding: "5px 0px",
                        fontSize: "16px",
                        fontWeight: 400,
                    }}
                >
                    Fanout, catch, store, index, search celery tasks/events from different brokers. Inspect and monitor
                    tasks with handy charts/metrics and build conditional triggers to fanout critical events to Slack.
                </h3>

                <div>
                    <Link to={useBaseUrl("/docs/getting-started/docker")}>
                        <button className="indexButton">Getting started</button>
                    </Link>
                    <Link to="https://www.buymeacoffee.com/fennec">
                        <button className="indexButton" style={{marginLeft: 10,}}>
                            <img
                                src={useBaseUrl('img/coffee.svg')}
                                style={{width: 22, height: 22, position: "absolute"}}
                            />
                            <span style={{marginLeft: 25}}>Buy me a Coffee</span>
                        </button>
                    </Link>
                </div>

                <div style={{width: "100%", height: 2, backgroundColor: "#33ccb8", marginTop: "15px"}}/>

                <div style={{flexWrap: "wrap", display: "flex", width: "100%", marginTop: "16px"}}>
                    <div style={itemStyle}>
                        <i style={{color: "var(--ifm-link-color)",}}>Multi-Brokers support</i> -
                        Other monitoring tools can connect to only one broker, which enforces you to deploy
                        many instances to monitor them all. however Leek with its Agent, it can monitor tasks from multiple
                        brokers with only a single instance of leek.
                    </div>
                    <div style={itemStyle}>
                        <i style={{color: "var(--ifm-link-color)",}}>Enhanced storage</i> -
                        Unlike other alternatives that stores the events in volatile RAM, celery events are indexed to
                        elasticsearch to offer persistence and fast retrieval/search.
                    </div>
                    <div style={itemStyle}>
                        <i style={{color: "var(--ifm-link-color)",}}>Multi-ENVs support</i> -
                        When connecting Leek agent to brokers, you can add environments tags, this will help you split celery
                        events into qa, stg, prod subsets so later you can filter task by environment name.
                    </div>
                    <div style={itemStyle}>
                        <i style={{color: "var(--ifm-link-color)",}}>Notification</i> -
                        You can define notification rules that will trigger a slack notification to inform you about
                        critical events, the notification triggers rules support task state, exclude/include task names,
                        environment name, and runtime upper bound.
                    </div>
                    <div style={itemStyle}>
                        <i style={{color: "var(--ifm-link-color)",}}>Charts</i> -
                        Leek offers multiple charts that will give you an idea about the application state, these chart
                        includes: tasks states distribution, tasks queues distribution, top 5 executed tasks, top 5
                        slow tasks, tasks failure over time ...
                    </div>
                    <div style={itemStyle}>
                        <i style={{color: "var(--ifm-link-color)",}}>Beautiful UI</i> -
                        Unlike other alternatives which are either only a command line tool or have a very bad UI, Leek
                        offers a great user experience thanks to its beautiful well designed UI.
                    </div>
                </div>
            </div>
        </Layout>
    );
};

