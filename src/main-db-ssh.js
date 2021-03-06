const { BrowserWindow } = require('electron');
const path = require('path');
const mysql = require('mysql2');
const { Client } = require('ssh2');
const ssh = new Client();
const prefs = require(path.join(__dirname,'main-preferences.js'));
const log = require('electron-log');

class dbssh {
  ssh;
  create = () => {
    this.ssh = new Client();
  }
  connection = () => {
    return new Promise((resolve, reject) => {
      try {
        this.create();
        let preferences = prefs.getPreferences();
        this.ssh.on('ready', () => {
          this.ssh.forwardOut(
            '127.0.0.1',
            3306,
            preferences.sql.host,
            preferences.ssh.remotePort,
          (err, stream) => {
            if (err) {
              reject(err);
            }
            else {
              let connection = mysql.createConnection({
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
        this.ssh.on('error', error => {
          log.error(error);
          let msg;
          switch (error.code) {
            case 'ENOTFOUND':
              msg = 'Host not found';
              break;
            case 'ETIMEDOUT':
              msg = 'Connection timed out';
              break;
            case 'ECONNREFUSED':
              msg = 'Connection refused';
              break;
            default:
              msg = error.message;
          }
          BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', msg);
        });
        this.ssh.connect({
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
  }

  end = () => {
    this.ssh.end();
    delete this.ssh;
  };
}

module.exports = dbssh;