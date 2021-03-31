const path = require('path');
const mysql = require('mysql2');
const prefs = require(path.join(__dirname,'main-preferences.js'));

class mysqlConn {
  connection = () => {
    return new Promise((resolve, reject) => {
      try {
        let preferences = prefs.getPreferences();
        let connection = mysql.createConnection({
          host     : preferences.sql.host,
          user     : preferences.sql.user,
          password : preferences.sql.pass, 
          database : preferences.sql.db
        });
        connection.connect((err) => {
          if (err) reject(err);
          else resolve(connection);
        });
      }
      catch (error) {
        reject(error);
      }
    });
  }

  end = () => {
    //do nothing
  }
};

let db = new mysqlConn;

module.exports = db;