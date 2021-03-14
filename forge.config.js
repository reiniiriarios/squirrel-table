const fs = require('fs');
const zip = require('adm-zip');
const pjson = require('./package.json');

function createFiles(callback) {
    fs.mkdirSync(out + vName + '/sql');
    fs.copyFileSync('.env.sample', out + vName + '/.env.sample');
    fs.copyFileSync('LICENSE', out + vName + '/LICENSE');
    fs.copyFileSync('README.md', out + vName + '/README.md');
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
        postMake: async (outputs) => {
            let name = 'SquirrelTable-win32-x64';
            let vName =  name + '-' + pjson.version;
            let out = 'out/';
            fs.rename(out + name,out + vName,() => {
                createFiles(() => {
                    let zipFile = new zip();
                    zipFile.addLocalFolder(out + vName, vName);
                    zipFile.writeZip('dist/' + vName + '.zip');
                })
            });
        }
    }
}