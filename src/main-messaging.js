const { BrowserWindow, ipcMain, dialog } = require('electron');
const log = require('electron-log');
// log. error, warn, info, verbose, debug, silly

// Error handling
module.exports.showError = (message) => {
    log.error(message);
    // todo: handle this differently
    BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', message);
    dialog.showErrorBox('Oops! Something went wrong.', message.toString());
}

// Status updates to renderer
module.exports.sendStatus = (status) => {
    console.log(status);
    BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', status);
}

ipcMain.handle('show-error-dialog', (event, message) => {
    dialog.showErrorBox('Oops! Something went wrong.', message.toString());
});