// SquirrelTable
// Copyright (C) 2021 Emma Litwa-Vulcu
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const { app, BrowserWindow, ipcMain, dialog, Menu, globalShortcut } = require('electron');
const path = require('path');
const windowStateKeeper = require('electron-window-state');
const log = require('electron-log'); // log. error, warn, info, verbose, debug, silly

// Remove menu toolbar
Menu.setApplicationMenu(false);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const prefs = require(path.join(__dirname,'main-preferences.js'));

let mainWindow;

// Some APIs can only be used after ready
app.on('ready', function() {
  prefs.loadPreferences().then((preferences) => {
    // main process files that run when asked to by renderer
    // these files require preferences to be set
    require(path.join(__dirname,'main-sql-list.js'));
    require(path.join(__dirname,'main-run-query.js'));
    require(path.join(__dirname,'main-save-csv.js'));
    require(path.join(__dirname,'main-save-xl.js'));
    require(path.join(__dirname,'main-update.js'));
    
    createMainWindow();
  }).catch(err => {
    log.error(err);
  });
});

function createMainWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1100,
    defaultHeight: 640
  });
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1050,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,  // deprecated
      contextIsolation: false // replaces nodeIntegration
    },
    frame: false, // frameless window
    icon: path.join(__dirname, 'build/icons/icon.ico')
  });
  global.mainWindowId = mainWindow.id;

  mainWindowState.manage(mainWindow);

  mainWindow.loadFile(path.join(__dirname,'index.html'));
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// App control buttons
ipcMain.handle('close-app', (event) => {
  app.quit();
});
ipcMain.handle('minimize-app', (event) => {
  mainWindow.minimize();
});
ipcMain.handle('maximize-app', (event) => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.handle('refresh-window', (event) => {
  mainWindow.reload();
});
ipcMain.handle('toggle-devtools', (event) => {
  mainWindow.webContents.toggleDevTools();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Init data only available in main process
ipcMain.on('init-variables', (event) => {
  data = {
    appName: app.getName(),
    appVersion: app.getVersion(),
    resources: process.resourcesPath
  };
  event.reply('init-reply', data);
});

ipcMain.handle('log-error', (event, message) => {
  log.error(message);
});
