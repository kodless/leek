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
                    <Link to="/dashboard">
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

                <div style={{width: "100%", height: 2, backgroundColor: "#33ccb8", marginTop: "30px"}}/>

                <div style={{flexWrap: "wrap", display: "flex", width: "100%", marginTop: "24px"}}>
                    <div style={itemStyle}>
                        Unlike other alternatives, Leek agent support multiple brokers, multiple staging environments
                        and multiple a applications. so no need to spin up a runtime for each broker.
                    </div>
                    <div style={itemStyle}>
                        Leek does not store events in memory and instead Celery events are indexed in elasticsearch for
                        persistence and faster search/aggregations.
                    </div>
                    <div style={itemStyle}>
                        Build notification rules around tasks state/name/env/runtime ... that will be triggered
                        conditionally and send alerts to slack channels.
                    </div>
                    <div style={itemStyle}>
                        Get insights from multiple charts and metrics that will let you know when there is anything
                        wrong
                        in your workers fleet.
                    </div>
                    <div style={itemStyle}>
                        Filter by anything
                    </div>
                    <div style={itemStyle}>
                        Delete old events
                    </div>
                </div>
            </div>
        </Layout>
    );
};
