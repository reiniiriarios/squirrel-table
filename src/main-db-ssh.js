const path = require('path');
const mysql = require('mysql2');
const { Client } = require('ssh2');
const ssh = new Client();
const prefs = require(path.join(__dirname,'main-preferences.js'));

preferences = prefs.getPreferences();

let dbssh = () => {
  try {
    let conn = new Promise((resolve, reject) => {
      ssh.on('ready', function() {
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
            connection.connect((err) => {
              if (!err) {
                resolve(connection);
              } else {
                reject(err);
              }
            });
          }
        });
      }).connect({
        host: preferences.ssh.host,
        port: preferences.ssh.port,
        username: preferences.ssh.user,
        password: preferences.ssh.pass,
        privateKey: prefs.getSshPrivateKey()
      });
    });
    return conn;
  }
  catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = dbssh;