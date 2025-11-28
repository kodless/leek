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

exports.shouldUpdateScroll = ({ routerProps: { location }, getSavedScrollPosition }) => {
  const { pathname } = location;

  // List of routes where you want to scroll to the top
  const scrollToTopRoutes = [`/privacy-policy`,];

  // If the new route is in the list, scroll to top (0, 0)
  if (scrollToTopRoutes.includes(pathname)) {
    window.scrollTo(0, 0);
  }

  // Return false to prevent Gatsby's default scroll restoration
  return false;
};

// Wraps every page in a component
exports.wrapPageElement = ({ element, props }) => {
  return (
    <React.StrictMode>
      <QueryParamProvider history={history} {...props}>
        <HelmetProvider {...props}>
          <ThemeSwitcherProvider
            themeMap={themes}
            defaultTheme={localStorage.getItem("theme") || "dark"}
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
