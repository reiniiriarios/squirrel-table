const { BrowserWindow, ipcMain, app } = require('electron');
const fetch = require('node-fetch');
const semver = require('semver');
const log = require('electron-log');

const updateError = (error) => {
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-error', error);
};

ipcMain.on('check-for-updates',(event) => {
  fetch('https://api.github.com/repos/reiniiriarios/squirrel-table/releases?per_page=1').then(res => res.json()).then(releases => {
    let latestVersion = semver.clean(releases[0].tag_name);
    if (semver.gt(latestVersion, app.getVersion())) {
      //todo: filter by process.platform
      //todo: use request to implement direct downloads
      let downloadUrl = 'https://github.com/reiniiriarios/squirrel-table/releases/download/' + releases[0].tag_name + '/SquirrelTableSetup.exe';
      BrowserWindow.fromId(global.mainWindowId).webContents.send('update-available', downloadUrl);
    }
    else {
      BrowserWindow.fromId(global.mainWindowId).webContents.send('update-not-available');
    }
  }).catch(err => {
    log.error(err);
    updateError(err);
  });
});