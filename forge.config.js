const fs = require('fs');
const path = require('path');
const githubjson = require('./.github.json');
const sass = require('node-sass');
const yaml = require('js-yaml');
// const { resolve } = require('path');
// const { rejects } = require('assert');

module.exports = {
  packagerConfig: {
    icon: "build/icons/icon.ico",
    ignore: [
      /^\/build/,
      /^\/design/,
      /^\/dist/,
      /^\/scss/,
      /\.gitignore/,
      /\.github.*\.json/,
      /preferences\.json/,
      /imported_key/
    ]
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "SquirrelTable",
        iconUrl: "file:///c:/code/squirrel-table/build/icons/icon.ico",
        setupExe: "SquirrelTableSetup.exe",
        setupIcon: "build/icons/icon.ico",
        noDelta: true,
        // STOP: No use in creating deltas until can sign certificates
        // remoteReleases: "http://127.0.0.1:8080",
        // remoteReleases: "https://github.com/reiniiriarios/squirrel-table",
        // remoteToken: githubjson.token,
        loadingGif: "",
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        title: "SquirrelTable",
        icon: 'build/icons/icon.icns',
        background: 'build/dmg-background.png', // will include dmg-background@2x.png for retina screens
        format: 'ULFO', // macOS 10.11 or later
        /*
        "icon-size": 64,
        window: {
          position: { x, y },
          size: { w, h }
        },
        */
        contents: [
          { "x": 448, "y": 344, "type": "link", "path": "/Applications" },
          { "x": 192, "y": 344, "type": "file", "path": "SquirrelTable.app" }
        ]
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "win32",
        "darwin"
      ]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {}
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {}
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'reiniiriarios',
          name: 'squirrel-table'
        },
        prerelease: false,
        authToken: githubjson.token,
      }
    },
    {
      name: 'electron-forge-publisher-local',
      config: {
        directory: 'c:/code/squirrel-table/dist'
      }
    }
  ],
  hooks: {
    generateAssets: async (forgeConfig) => {
      await sass.render({
        file: 'scss/main.scss',
        outFile: 'src/style.css'
      }, (err, result) => {
        if (err) {
          console.log(err);
        }
        else {
          fs.writeFile('src/style.css', result.css, (err) => {
            if (err) {
              console.log(err);
            }
          });
        }
      });
    },
    postPackage: async (forgeConfig, options) => {
      await fs.copyFileSync('LICENSE', options.outputPaths[0] + '/LICENSE');
      await fs.copyFileSync('README.md', options.outputPaths[0] + '/README.md');
      // windows tile here..?
      if (options.spinner) {
        options.spinner.info(`Packaged for ${options.platform} / ${options.arch} at ${options.outputPaths[0]}`);
      }

      let data = {
        provider: 'github',
        owner: 'reiniiriarios',
        repo: 'squirrel-table',
      };
      /*
      let data = {
        provider: 'generic',
        url: 'http://127.0.0.1:8080/'
      };
      */
      switch (process.platform) {
        case "win32":
          data.updaterCacheDirName = 'squirreltable-updater';
          data.publisherName = ['Emma Litwa-Vulcu'];
          fs.writeFileSync(
            path.join(options.outputPaths[0],'resources','app-update.yml')
            , yaml.dump(data)
            , 'utf8'
          );
          break;
        default: // unix
          data.updaterCacheDirName = 'squirreltable-updater'
          fs.writeFileSync(
            path.join(options.outputPaths[0],'Contents','Resources','app-update.yml')
            , yaml.dump(data)
            , 'utf8'
          );
          break;
      }
      /*
      fs.writeFileSync(
        path.join(__dirname, 'dev-app-update.yml')
        , yaml.dump(data)
        , 'utf8'
      );
      */
    },
    postMake: async (forgeConfig, makeResultObjects) => {
      
    }
  }
}