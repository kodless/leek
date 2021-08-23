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
    return <React.StrictMode {...props}>
        <ThemeSwitcherProvider
            themeMap={themes} defaultTheme={typeof window !== "undefined"? localStorage.getItem("theme") || "dark": "dark"} {...props}
        >
            <AuthProvider {...props}>
                <ApplicationProvider {...props}>
                    <AppLayout>{element}</AppLayout>
                </ApplicationProvider>
            </AuthProvider>
        </ThemeSwitcherProvider>
    </React.StrictMode>
};
