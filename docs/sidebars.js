/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/docker',
        'getting-started/configuration',
      ],
    },
    {
      type: 'category',
      label: 'WordPress Plugins',
      collapsed: false,
      items: [
        'plugins/wp-bridge',
        'plugins/wp-dash-standalone',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/rest-api',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      items: [
        'security/authentication',
      ],
    },
  ],
};

module.exports = sidebars;
