const { app, BrowserWindow, ipcMain, dialog, Menu, globalShortcut } = require('electron');
const path = require('path');
const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
require('dotenv').config();

Menu.setApplicationMenu(false);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: false,
    icon: path.join(__dirname, 'build/icons/icon.ico')
  });

	globalShortcut.register('CommandOrControl+R', function() {
		mainWindow.reload();
	});
  
	globalShortcut.register('CommandOrControl+D', function() {
    mainWindow.webContents.openDevTools();
	});

  mainWindow.loadFile(path.join(__dirname,'index.html'));
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('close-app', (event) => {
  app.quit();
});
ipcMain.handle('minimize-app', (event) => {
  mainWindow.minimize();
});
ipcMain.handle('maximize-app', (event) => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('init-variables', (event) => {
  data = {
    appName: app.getName(),
    appVersion: app.getVersion(),
    resources: process.resourcesPath
  };
  event.reply('init-reply', data);
});

// Error handling
showError = function(message) {
  console.log(message);
  mainWindow.webContents.send('error-status', message);
  dialog.showErrorBox('Oops! Something went wrong.', message);
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
require(path.join(__dirname,'runquery.js'));