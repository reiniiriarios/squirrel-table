const { BrowserWindow } = require('electron');
const path = require('path');
const mysql = require('mysql2');
const { Client } = require('ssh2');
const ssh = new Client();
const prefs = require(path.join(__dirname,'main-preferences.js'));
const log = require('electron-log');

preferences = prefs.getPreferences();

// todo:
// ssh.dispose();

let dbssh = () => {
  try {
    let conn = new Promise((resolve, reject) => {
      try {
        ssh.on('ready', () => {
          ssh.forwardOut(
            '127.0.0.1',
            3306,
            preferences.sql.host,
            preferences.ssh.remotePort,
          (err, stream) => {
            if (err) {
              reject(err);
            }
            else {
              connection = mysql.createConnection({
                host     : preferences.sql.host,
                user     : preferences.sql.user,
                password : preferences.sql.pass, 
                database : preferences.sql.db,
                stream: stream
              });
              connection.connect(err => {
                if (err) {
                  reject(err);
                }
                else {
                  resolve(connection);
                }
              });
            }
          });
        });
        ssh.connect({
          host: preferences.ssh.host,
          port: preferences.ssh.port,
          username: preferences.ssh.user,
          password: preferences.ssh.pass,
          privateKey: prefs.getSshPrivateKey()
        });
      }
      catch (error) {
        log.error(error);
        BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', error.message);
      }
    });
    return conn;
  }
  catch (error) {
    log.error(error);
    BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', error.message);
  }
};

module.exports = dbssh;