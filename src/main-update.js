const { BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
// const messenger = require(path.join(__dirname,'main-messaging.js'));

autoUpdater.channel = 'latest';
autoUpdater.allowDowngrade = false;

//autoUpdater.logger = logger;
//autoUpdater.logger.transports.file.level = 'debug';
//autoUpdater.logger.transports.file.appName = 'squirrel-table';
autoUpdater.autoDownload = false;

autoUpdater.on('update-downloaded', (info) => {
  console.log(info);
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-downloaded');
});

/*
autoUpdater.on('checking-for-update', () => {
});
*/
autoUpdater.on('update-available', (info) => {
  console.log(info);
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-available');
});
autoUpdater.on('update-not-available', (info) => {
  console.log(info);
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-not-available');
});

autoUpdater.on('download-progress', (progressObj) => {
  // progressObj.bytesPerSecond
  //            .percent
  //            .transferred
  //            .total
  BrowserWindow.fromId(global.mainWindowId).webContents.send('download-progress', progressObj);
});

const updateError = (error) => {
  console.log(error);
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-error', error);
};
// The following is being triggered on top of updateError() already called in .catch
autoUpdater.on('error', (error) => {
  //autoUpdater.logger.debug(error);
  updateError(error);
});

ipcMain.on('check-for-updates',(event) => {
  autoUpdater.checkForUpdates().catch(err => { updateError(err) });
});
ipcMain.on('download-update',(event) => {
  autoUpdater.downloadUpdate().catch(err => { updateError(err) });
})
ipcMain.on('update-app',(event) => {
  autoUpdater.quitAndInstall().catch(err => { updateError(err) });
});