const { getThemeVariables } = require("antd/dist/theme");

export function getTheme(isDark) {
  return {
    ...getThemeVariables({
      dark: isDark, // Enable dark mode
      compact: true, // Enable compact mode
    }),
    // Primary
    "@primary-color": "#00BFA6",
    "@layout-header-height": "50px",
    "@layout-footer-height": "50px",
    "@layout-header-background": "@menu-bg",
    "@body-background": "@menu-bg",
    "@layout-body-background": "@body-background",
  };
}
