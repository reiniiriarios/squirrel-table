const { app, BrowserWindow, ipcMain, dialog, Menu, globalShortcut } = require('electron');
const path = require('path');
const log = require('electron-log');

// Remove menu toolbar
Menu.setApplicationMenu(false);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Main process files used in main processes
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
    require(path.join(__dirname,'main-update.js'));
    
    createMainWindow();
  }).catch(err => {
    log.error(err);
  });
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 640,
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

  // Cmd/Ctrl+R Refresh page, mostly useful for dev
	globalShortcut.register('CommandOrControl+R', function() {
		mainWindow.reload();
	});
  
  // Cmd/Ctrl+D Show dev tools
	globalShortcut.register('CommandOrControl+Shift+I', function() {
    mainWindow.webContents.openDevTools();
	});
  
  // Cmd/Ctrl+Q Quit app
	globalShortcut.register('CommandOrControl+Q', function() {
    app.quit();
	});

  // Load index
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
