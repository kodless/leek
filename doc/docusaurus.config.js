module.exports = {
  title: "Leek",
  tagline: "Leek is a celery tasks monitoring tool",
  url: "https://handbook.obytes.com/",
  baseUrl: "/",
  organizationName: "kodless",
  projectName: "leek",
  scripts: ["https://buttons.github.io/buttons.js"],
  favicon: "img/favicon.ico",
  customFields: {
    repoUrl: "https://github.com/kodless/leek",
  },
  onBrokenLinks: "log",
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          // homePageId: "devops/home",
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          path: "./docs",
          sidebarPath: require.resolve("./sidebars.json"),
        },
        blog: {},
        theme: {
          customCss: require.resolve("./src/css/customTheme.css"),
        },
      },
    ],
  ],
  plugins: [],
  themeConfig: {
    sidebarCollapsible: false,
    navbar: {
      title: "Leek",
      logo: {
        src: "img/logo.png",
      },
      items: [
        {
          to: "docs/architecture/components",
          label: "Documentation",
          position: "left",
        },
        {
          to: "https://github.com/kodless/leek",
          label: "Github",
          position: "right",
        },
      ],
    },
    footer: {
      links: [],
      copyright: "Made with ❤️ by Kodless",
      logo: {
        src: "img/favicon.ico",
      },
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
      switchConfig: {
        darkIcon: '🌙',
        lightIcon: '\u2600',
        darkIconStyle: {
          marginLeft: '2px',
        },
        lightIconStyle: {
          marginLeft: '1px',
        },
      },
    },
  },
};
