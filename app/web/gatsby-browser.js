require('antd/dist/antd.css');
const React = require("react");
const {AppLayout} = require("./src/containers/layout");
const {AuthProvider} = require("./src/context/AuthProvider");
const {ApplicationProvider} = require("./src/context/ApplicationProvider");

// Wraps every page in a component
exports.wrapPageElement = ({element, props}) => {
    return <AuthProvider {...props}>
        <ApplicationProvider {...props}>
            <AppLayout>{element}</AppLayout>
        </ApplicationProvider>
    </AuthProvider>
};
