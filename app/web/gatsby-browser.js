require('antd/dist/antd.css');
const React = require("react");
const {AppLayout} = require("./src/containers/layout");
const {AuthProvider} = require("./src/context/AuthProvider");
const {ApplicationProvider} = require("./src/context/ApplicationProvider");
const {ThemeSwitcherProvider} = require("react-css-theme-switcher");

const themes = {
    dark: `css/dark-theme.css`,
    light: `css/light-theme.css`,
};

// Wraps every page in a component
exports.wrapPageElement = ({element, props}) => {
    return <React.StrictMode {...props}>
        <ThemeSwitcherProvider
            themeMap={themes} defaultTheme={localStorage.getItem("theme") || "dark"} {...props}
        >
            <AuthProvider {...props}>
                <ApplicationProvider {...props}>
                    <AppLayout>{element}</AppLayout>
                </ApplicationProvider>
            </AuthProvider>
        </ThemeSwitcherProvider>
    </React.StrictMode>
};
