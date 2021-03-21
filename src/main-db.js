const path = require('path');
const mysql = require('mysql2');
const prefs = require(path.join(__dirname,'main-preferences.js'));

preferences = prefs.getPreferences();

let db = () => {
  try {
    let conn = new Promise((resolve, reject) => {
      connection = mysql.createConnection({
        host     : preferences.sql.host,
        user     : preferences.sql.user,
        password : preferences.sql.pass, 
        database : preferences.sql.db
      });
      connection.connect((err) => {
        if (err) reject(err);
        else resolve(connection);
      });
    });
    return conn;
  }
  catch (error) {
    throw error;
  }
};

module.exports = db;