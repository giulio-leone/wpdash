// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'WP Dash',
  tagline: 'Centralized WordPress monitoring and maintenance dashboard',
  favicon: 'img/favicon.ico',

  url: 'https://giulio-leone.github.io',
  baseUrl: '/wpdash/',

  organizationName: 'giulio-leone',
  projectName: 'wpdash',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/giulio-leone/wpdash/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'WP Dash',
        logo: {
          alt: 'WP Dash Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'mainSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://github.com/giulio-leone/wpdash',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Getting Started', to: '/docs/intro' },
              { label: 'REST API Reference', to: '/docs/api/rest-api' },
              { label: 'Docker', to: '/docs/getting-started/docker' },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/giulio-leone/wpdash',
              },
              {
                label: 'Releases',
                href: 'https://github.com/giulio-leone/wpdash/releases',
              },
              {
                label: 'Commercial License',
                href: 'https://giulioleone.com',
              },
              {
                label: 'Contact',
                href: 'mailto:giulioleone097@gmail.com',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} WP Dash. Business Source License 1.1.`,
      },
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
        additionalLanguages: ['php', 'bash', 'json', 'docker'],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
};

module.exports = config;
