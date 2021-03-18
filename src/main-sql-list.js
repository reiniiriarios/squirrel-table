const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const messenger = require(path.join(__dirname,'main-messaging.js'));
const prefs = require(path.join(__dirname,'main-preferences.js'));

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
    messenger.showError(error);
  }
});