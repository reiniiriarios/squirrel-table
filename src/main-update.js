const { BrowserWindow, ipcMain, autoUpdater } = require('electron');
// const messenger = require(path.join(__dirname,'main-messaging.js'));
const log = require('electron-log');

autoUpdater.channel = 'latest';
autoUpdater.allowDowngrade = false;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.logger.transports.file.appName = 'squirrel-table';
autoUpdater.autoDownload = false;
// autoUpdater.setFeedURL('http://127.0.0.1:8080');

const updateError = (error) => {
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-error', error);
};
// The following is triggered on top of updateError() already called in .catch
autoUpdater.on('error', (error) => {
  // updateError(error);
});
/*
autoUpdater.on('checking-for-update', () => {
});
*/
autoUpdater.on('update-available', (info) => {
  // info = json obj of latest.yml
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-available', info);
});
autoUpdater.on('update-not-available', (info) => {
  // info = json obj of latest.yml
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-not-available');
});

ipcMain.on('check-for-updates',(event) => {
  autoUpdater.checkForUpdates().catch(err => { updateError(err) });
});

/*
STOP: Cannot continue with autoupdater without digitally signing updates

ipcMain.on('download-update',(event) => {
  autoUpdater.downloadUpdate().catch(err => { updateError(err) });
})
autoUpdater.on('download-progress', (progressObj) => {
  // progressObj.bytesPerSecond
  //            .percent
  //            .transferred
  //            .total
  BrowserWindow.fromId(global.mainWindowId).webContents.send('download-progress', progressObj);
});
autoUpdater.on('update-downloaded', (info) => {
  // info = json obj of latest.yml
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-downloaded');
});
ipcMain.on('update-app',(event) => {
  autoUpdater.quitAndInstall().catch(err => { updateError(err) });
});
*/