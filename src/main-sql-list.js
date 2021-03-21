const { BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const prefs = require(path.join(__dirname,'main-preferences.js'));
const log = require('electron-log');

ipcMain.on('list-queries',(event) => {
  try {
    let dir = prefs.getPreferences('sqlDir');
    if (dir && dir.trim() != '') {
      if (!fs.existsSync(dir)) {
        event.reply('no-dir');
        event.reply('sql-dir-not-found');
      }
      else {
        let sqlfiles = [];
        let files = fs.readdirSync(dir);
        files.forEach(file => {
          if (path.extname(file) == ".sql") {
            let name = path.basename(file, '.sql');
            sqlfiles.push(name);
          }
        });
        sqlfiles.sort(function (a, b) {
          return a.toLowerCase().localeCompare(b.toLowerCase());
        });
        event.reply('sql-list',sqlfiles);
      }
    }
    else {
      event.reply('no-dir');
    }
  }
  catch (error) {
    BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', error);
    log.error(error);
  }
});

ipcMain.on('read-sql', (event, name) => {
  try {
    fs.readFile(path.join(prefs.getPreferences('sqlDir'), name + '.sql'), (err, sql) => {
      if (err) throw err;
      sql = sql.toString();
      event.reply('sql-read', sql);
    });
  }
  catch (err) {
    BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', err);
    log.error(err);
  }
});