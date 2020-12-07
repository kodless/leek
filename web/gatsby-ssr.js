require('antd/dist/antd.css');
const React = require("react");
const {AppLayout} = require("./src/containers/layouts/app");
const {DocsLayout} = require("./src/containers/layouts/docs");
const {AuthProvider} = require("./src/context/AuthProvider");
const {ApplicationProvider} = require("./src/context/ApplicationProvider");

exports.onRenderBody = ({setPostBodyComponents}) => {
    setPostBodyComponents([
        <script
            key="/leek-config.js"
            src="/leek-config.js"
            charset="utf8"
            type="text/javascript"
            crossOrigin="anonymous"
        />,
    ])
};

// Wraps every page in a component
exports.wrapPageElement = ({element, props}) => {
    return <>
        {
            (
                element.props.location.pathname.startsWith("/app") &&
                <AuthProvider {...props}>
                    <ApplicationProvider {...props}>
                        <AppLayout>{element}</AppLayout>
                    </ApplicationProvider>
                </AuthProvider>
            )
            ||
            (
                element.props.location.pathname.startsWith("/docs") &&
                <DocsLayout {...props}>{element}</DocsLayout>
            )
            ||
            element
        }
    </>
};
