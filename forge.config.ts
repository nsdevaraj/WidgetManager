import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './assets/icon',
    appBundleId: 'com.urlwidgets.app',
    appCategoryType: 'public.app-category.productivity',
    osxSign: {
      identity: 'Developer ID Application: NS Devaraj',
      optionsForFile: () => ({
        hardenedRuntime: true,
        gatekeeperAssess: false,
        entitlements: 'entitlements.plist',
        'entitlements-inherit': 'entitlements.plist',
        'signature-flags': 'library'
      })
    },
    protocols: [
      {
        name: 'URL Widgets Protocol',
        schemes: ['urlwidgets']
      }
    ],
    ignore: [
      /^\/(?!dist|package\.json|node_modules)/,
      /\.git/,
      /\.vscode/,
      /\.idea/,
      /\.DS_Store/
    ]
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'URLWidgets',
      authors: 'Devaraj',
      iconUrl: 'https://url-to-your-icon.ico',
      setupIcon: './assets/icon.ico',
      certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
      certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({
      options: {
        icon: './assets/icon.png',
        maintainer: 'Devaraj',
        homepage: 'https://your-website.com'
      }
    }),
    new MakerRpm({
      options: {
        icon: './assets/icon.png',
        description: 'App for URL Widgets',
        homepage: 'https://your-website.com'
      }
    })
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'your-github-username',
          name: 'URLWidgets'
        },
        prerelease: false,
        draft: true
      }
    }
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/renderer.tsx',
            name: 'main_window',
            preload: {
              js: './src/main/preload.ts',
            },
          },
          {
            html: './src/renderer/widget.html',
            js: './src/renderer/widget.tsx',
            name: 'widget_window',
            preload: {
              js: './src/main/preload.ts',
            },
          },
        ],
      },
      devContentSecurityPolicy: `default-src 'self' 'unsafe-inline' 'unsafe-eval' data: ws:;
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        font-src 'self' data:;
        connect-src 'self' ws: http: https:;`,
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
