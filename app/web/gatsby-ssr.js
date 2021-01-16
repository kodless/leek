require('antd/dist/antd.css');
const React = require("react");
const {AppLayout} = require("./src/containers/layout");
const {AuthProvider} = require("./src/context/AuthProvider");
const {ApplicationProvider} = require("./src/context/ApplicationProvider");

exports.onRenderBody = ({setPostBodyComponents}) => {
    setPostBodyComponents([
        <script
            key="/leek-config.js"
            src="/leek-config.js"
            charSet="utf8"
            type="text/javascript"
            crossOrigin="anonymous"
        />,
    ])
};

// Wraps every page in a component
exports.wrapPageElement = ({element, props}) => {
    return <AuthProvider {...props}>
        <ApplicationProvider {...props}>
            <AppLayout>{element}</AppLayout>
        </ApplicationProvider>
    </AuthProvider>
};
