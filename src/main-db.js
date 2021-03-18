const path = require('path');
const mysql = require('mysql2');
const prefs = require(path.join(__dirname,'main-preferences.js'));

preferences = prefs.getPreferences();

let db = () => {
  try {
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
    return connection;
  }
  catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = db;