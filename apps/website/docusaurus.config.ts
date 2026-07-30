import path from 'path';
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const keisenPackages = [
  path.resolve(__dirname, '../../packages/core/src'),
  path.resolve(__dirname, '../../packages/react/src'),
];

const config: Config = {
  title: 'Keisen',
  tagline: 'Modern candlestick chart components for the web',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://keisen-charts.com',
  baseUrl: '/',

  organizationName: 'keisen',
  projectName: 'keisen',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-Hans'],
    localeConfigs: {
      en: {
        label: 'English',
        htmlLang: 'en',
      },
      'zh-Hans': {
        label: '简体中文',
        htmlLang: 'zh-Hans',
      },
    },
  },

  plugins: [
    () => ({
      name: 'keisen-charts-workspace',
      configureWebpack(_config, isServer, {getJSLoader}) {
        return {
          resolve: {
            alias: {
              '@keisen-charts/core': path.resolve(
                __dirname,
                '../../packages/core/src',
              ),
              '@keisen-charts/react': path.resolve(
                __dirname,
                '../../packages/react/src',
              ),
              '@keisen-charts/react/toolkit': path.resolve(
                __dirname,
                '../../packages/react/src/toolkit',
              ),
            },
            fullySpecified: false,
          },
          module: {
            rules: [
              {
                test: /\.tsx?$/,
                include: keisenPackages,
                use: [getJSLoader({isServer})],
              },
            ],
          },
          // 副图显隐会触发多 canvas 同帧 resize；该错误良性，勿挡开发 overlay
          devServer: {
            client: {
              overlay: {
                runtimeErrors: (error: Error) =>
                  !/ResizeObserver loop/.test(error?.message ?? ''),
              },
            },
          },
        };
      },
    }),
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: false,
        gtag: {
          trackingID: 'G-8K3PJHWDL2',
          anonymizeIP: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Keisen',
      logo: {
        alt: 'Keisen',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/Dieber/keisen-charts',
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
            {label: 'Introduction', to: '/docs/introduction'},
            {label: 'Quick Start', to: '/docs/quick-start'},
            {label: 'API Reference', to: '/docs/api'},
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/Dieber/keisen-charts',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Keisen.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
