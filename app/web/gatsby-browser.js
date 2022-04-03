const React = require("react");
const {navigate} = require('gatsby');
const {AppLayout} = require("./src/containers/layout");
const {AuthProvider} = require("./src/context/AuthProvider");
const {ApplicationProvider} = require("./src/context/ApplicationProvider");
const {ThemeSwitcherProvider} = require("react-css-theme-switcher");
const {QueryParamProvider} = require('use-query-params');
const {HelmetProvider} = require('react-helmet-async');

const themes = {
    dark: `/css/dark-theme.css`,
    light: `/css/light-theme.css`,
};


function generatePath(location) {
    return location.pathname + location.search;
}

const history = {
    push: (location) => {
        navigate(generatePath(location), {replace: false, state: location.state});
    },
    replace: (location) => {
        navigate(generatePath(location), {replace: true, state: location.state});
    },
};

// Wraps every page in a component
exports.wrapPageElement = ({element, props}) => {
    return <React.StrictMode>
        <HelmetProvider {...props}>
            <QueryParamProvider history={history} {...props}>
                <ThemeSwitcherProvider
                    themeMap={themes} defaultTheme={localStorage.getItem("theme") || "dark"} {...props}
                    history={history}
                >
                    <AuthProvider {...props}>
                        <ApplicationProvider {...props}>
                            <AppLayout>{element}</AppLayout>
                        </ApplicationProvider>
                    </AuthProvider>
                </ThemeSwitcherProvider>
            </QueryParamProvider>
        </HelmetProvider>
    </React.StrictMode>
};
