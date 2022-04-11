const React = require("react");
const { navigate } = require("gatsby");
const { AppLayout } = require("./src/containers/layout");
const { AuthProvider } = require("./src/context/AuthProvider");
const { ApplicationProvider } = require("./src/context/ApplicationProvider");
const { ThemeSwitcherProvider } = require("react-css-theme-switcher");
const { QueryParamProvider } = require("use-query-params");
const { HelmetProvider } = require("react-helmet-async");

const themes = {
  dark: `/css/themes/dark.css`,
  light: `/css/themes/light.css`,
};

function generatePath(location) {
  return location.pathname + location.search;
}

const history = {
  push: (location) => {
    navigate(generatePath(location), { replace: false, state: location.state });
  },
  replace: (location) => {
    navigate(generatePath(location), { replace: true, state: location.state });
  },
};

exports.onRenderBody = ({ setPostBodyComponents }) => {
  setPostBodyComponents([
    <script
      key="/leek-config.js"
      src="/leek-config.js"
      charSet="utf8"
      type="text/javascript"
      crossOrigin="anonymous"
    />,
  ]);
};

// Wraps every page in a component
exports.wrapPageElement = ({ element, props }) => {
  return (
    <React.StrictMode {...props}>
      <QueryParamProvider history={history} {...props}>
        <HelmetProvider {...props}>
          <ThemeSwitcherProvider
            themeMap={themes}
            defaultTheme={
              typeof window !== "undefined"
                ? localStorage.getItem("theme") || "dark"
                : "dark"
            }
            {...props}
            history={history}
          >
            <AuthProvider {...props}>
              <ApplicationProvider {...props}>
                <AppLayout>{element}</AppLayout>
              </ApplicationProvider>
            </AuthProvider>
          </ThemeSwitcherProvider>
        </HelmetProvider>
      </QueryParamProvider>
    </React.StrictMode>
  );
};
