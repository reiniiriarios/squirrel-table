const fs = require('fs');
const zip = require('adm-zip');
const pjson = require('./package.json');
const sass = require('node-sass');

function createFiles(path, callback) {
  fs.copyFileSync('LICENSE', path + '/LICENSE');
  fs.copyFileSync('README.md', path + '/README.md');
  callback();
}

module.exports = {
  packagerConfig: {
    "icon": "build/icons/icon.ico"
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "SquirrelTable",
        iconUrl: "file:///c:/code/squirrel-table/build/icons/icon.ico"
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
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
  hooks: {
    generateAssets: async (forgeConfig) => {
      console.log('Compiling SCSS...');
      sass.render({
        file: 'scss/main.scss',
        outFile: 'src/style.css'
      }, (err, result) => {
        if(!err){
          fs.writeFile('src/style.css', result.css, (err) => {
            if(!err){
              console.log('SCSS Compiled');
            }
            else {
              console.log(err);
            }
          });
        }
        else {
          console.log(err);
        }
      });
    },
    postMake: async (forgeConfig) => {
      console.log('Zipping distributable...');
      let name = 'SquirrelTable-win32-x64';
      let dir = 'out/' + name;
      let zipPathName = 'dist/' + name + '-' + pjson.version + '.zip';
      createFiles(dir,() => {
        let zipFile = new zip();
        zipFile.addLocalFolder(dir, name);
        zipFile.writeZip(zipPathName);
        console.log('Distributable at "' + zipPathName + '"');
      })
    }
  }
}