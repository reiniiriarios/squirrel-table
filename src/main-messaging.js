const { BrowserWindow, ipcMain, dialog } = require('electron');

// Error handling
module.exports.showError = (message) => {
    console.log(message);
    BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', message);
    dialog.showErrorBox('Oops! Something went wrong.', message);
}

// Status updates to renderer
module.exports.sendStatus = (status) => {
    console.log(status);
    BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', status);
}

ipcMain.handle('show-error-dialog', (event, message) => {
    dialog.showErrorBox('Oops! Something went wrong.', message);
});