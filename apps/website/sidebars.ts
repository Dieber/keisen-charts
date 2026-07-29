import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'introduction',
    'quick-start',
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/data',
        'guides/resolution',
        'guides/controlled',
        'guides/timezone',
        'guides/i18n',
        'guides/theme',
        'guides/formatter',
        'guides/panes',
        'guides/indicators',
        'guides/draw-tools',
      ],
    },
    'api',
  ],
};

export default sidebars;
