const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const prefs = require(path.join(__dirname,'main-preferences.js'));
const dbssh = require(path.join(__dirname,'main-db-ssh.js'));
const db = require(path.join(__dirname,'main-db.js'));
const log = require('electron-log');

const columnTypes = {
  MYSQL_TYPE_DECIMAL:     0,
  MYSQL_TYPE_TINY:        1,
  MYSQL_TYPE_SHORT:       2,
  MYSQL_TYPE_LONG:        3,
  MYSQL_TYPE_FLOAT:       4,
  MYSQL_TYPE_DOUBLE:      5,
  MYSQL_TYPE_NULL:        6,
  MYSQL_TYPE_TIMESTAMP:   7,
  MYSQL_TYPE_LONGLONG:    8,
  MYSQL_TYPE_INT24:       9,
  MYSQL_TYPE_DATE:        10,
  MYSQL_TYPE_TIME:        11,
  MYSQL_TYPE_DATETIME:    12,
  MYSQL_TYPE_YEAR:        13,
  MYSQL_TYPE_NEWDATE:     14,  // internal
  MYSQL_TYPE_VARCHAR:     15,
  MYSQL_TYPE_BIT:         16,
  MYSQL_TYPE_TIMESTAMP2:  17,
  MYSQL_TYPE_DATETIME2:   18,  // internal
  MYSQL_TYPE_TIME2:       19,  // internal
  MYSQL_TYPE_TYPED_ARRAY: 20,  // used for replication only
  MYSQL_TYPE_INVALID:     243,
  MYSQL_TYPE_BOOL:        244, // placeholder
  MYSQL_TYPE_JSON:        245,
  MYSQL_TYPE_NEWDECIMAL:  246,
  MYSQL_TYPE_ENUM:        247,
  MYSQL_TYPE_SET:         248,
  MYSQL_TYPE_TINY_BLOB:   249,
  MYSQL_TYPE_MEDIUM_BLOB: 250,
  MYSQL_TYPE_LONG_BLOB:   251,
  MYSQL_TYPE_BLOB:        252,
  MYSQL_TYPE_VAR_STRING:  253,
  MYSQL_TYPE_STRING:      254,
  MYSQL_TYPE_GEOMETRY:    255
}

const flags = {
  NOT_NULL_FLAG:          1,
  PRI_KEY_FLAG:           2,
  UNIQUE_KEY_FLAG:        4,
  MULTIPLE_KEY_FLAG:      8,
  BLOG_FLAG:              16,
  UNSIGNED_FLAG:          32,
  ZEROFILL_FLAG:          64,
  BINARY_FLAG:            128,
  ENUM_FLAG:              256,
  AUTO_INCREMENT_FLAG:    512,
  TIMESTAMP_FLAG:         1024,
  SET_FLAG:               2048,
  NO_SEFAULT_VALUE_FLAG:  4096,
  ON_UPDATE_NOW_FLAG:     8192,
  NUM_FLAG:               32768
}

preferences = prefs.getPreferences();

let connection = preferences.sshEnabled ? dbssh : db;

function runQuery(sql, callback) {
  if (preferences.sshEnabled) {
    BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'Connecting Over SSH');
  }
  else {
    BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'Connecting to Database');
  }
  try {
    connection().then(connection => {
      // query database 
      BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'Executing Query');
      connection.query({sql: sql,rowsAsArray: true}, (error, results, fields) => {
        if (error) throw error;
        parsedFields = [];
        fields.forEach((field) => {
          switch (field.columnType) {
            case columnTypes.MYSQL_TYPE_DECIMAL:
            case columnTypes.MYSQL_TYPE_NEWDECIMAL:
              field.displayType = 'decimal';
              break;
            case columnTypes.MYSQL_TYPE_TINY:
            case columnTypes.MYSQL_TYPE_SHORT:
            case columnTypes.MYSQL_TYPE_LONG:
            case columnTypes.MYSQL_TYPE_LONGLONG:
            case columnTypes.MYSQL_TYPE_INT24:
              field.displayType = 'int';
              break;
            case columnTypes.MYSQL_TYPE_FLOAT:
            case columnTypes.MYSQL_TYPE_DOUBLE:
              field.displayType = 'float';
              break;
            case columnTypes.MYSQL_TYPE_TIMESTAMP:
            case columnTypes.MYSQL_TYPE_DATE:
            case columnTypes.MYSQL_TYPE_TIME:
            case columnTypes.MYSQL_TYPE_DATETIME:
            case columnTypes.MYSQL_TYPE_YEAR:
              field.displayType = 'time';
              break;
            case columnTypes.MYSQL_TYPE_VARCHAR:
            case columnTypes.MYSQL_TYPE_VAR_STRING:
            case columnTypes.MYSQL_TYPE_STRING:
              field.displayType = 'string';
              break;
            case columnTypes.MYSQL_TYPE_JSON:
              field.displayType = 'json';
              break;
            case columnTypes.MYSQL_TYPE_BIT:
              field.displayType = 'bit';
              break;
            case columnTypes.MYSQL_TYPE_ENUM:
            case columnTypes.MYSQL_TYPE_SET:
              field.displayType = 'enum';
              break;
            case columnTypes.MYSQL_TYPE_TINY_BLOB:
            case columnTypes.MYSQL_TYPE_MEDIUM_BLOB:
            case columnTypes.MYSQL_TYPE_LONG_BLOB:
            case columnTypes.MYSQL_TYPE_BLOB:
              field.displayType = 'blob';
              break;
            default:
              field.displayType = 'other';
          }
          parsedFields.push({
            name:          field.name,
            encoding:      field.encoding,
            columnLength:  field.columnLength,
            columnType:    field.columnType,
            display:       field.displayType
          });
        });
        callback(parsedFields, results);
      });
    }).catch(err => {
      log.error(err);
      BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', err.message);
    });
  }
  catch (error) {
    log.error(error);
    BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', error.message);
  }
}

ipcMain.on('run-query', (event, sql) => {
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'Running Query');
  // sql = sql.replace(/(?:\r\n|\r|\n)/g, ' ');
  runQuery(sql, (fields, results) => {
    event.reply('query-result', fields, results);
  });
})


/*
results
[
  TextRow { vendor_id: 1439, vendor_name: '12 Oaks Desserts' },
  TextRow { vendor_id: 631, vendor_name: '1857 Spirits' }
]
results rowsAsArray:true
[
  [1439,'12 Oaks Desserts'],
  [631,'1857 Spirits']
]
fields
[
  ColumnDefinition {
    _buf: <Buffer 01 00 00 01 02 55 00 00 02 03 64 65 66 0d 35 32 71 7a 75 64 37 75 6f 6d 68 34 6d 10 75 64 72 6f 70 73 68 69 70 5f 76 65 6e 64 6f 72 10 75 64 72 6f 70 ... 202 more bytes>,
    _clientEncoding: 'utf8',
    _catalogLength: 3,
    _catalogStart: 10,
    _schemaLength: 13,
    _schemaStart: 14,
    _tableLength: 16,
    _tableStart: 28,
    _orgTableLength: 16,
    _orgTableStart: 45,
    _orgNameLength: 9,
    _orgNameStart: 72,
    characterSet: 63,
    encoding: 'binary',
    name: 'vendor_id',
    columnLength: 10,
    columnType: 3,
    flags: 16931,
    decimals: 0
  },
  ColumnDefinition {
    _buf: <Buffer 01 00 00 01 02 55 00 00 02 03 64 65 66 0d 35 32 71 7a 75 64 37 75 6f 6d 68 34 6d 10 75 64 72 6f 70 73 68 69 70 5f 76 65 6e 64 6f 72 10 75 64 72 6f 70 ... 202 more bytes>,
    _clientEncoding: 'utf8',
    _catalogLength: 3,
    _catalogStart: 99,
    _schemaLength: 13,
    _schemaStart: 103,
    _tableLength: 16,
    _tableStart: 117,
    _orgTableLength: 16,
    _orgTableStart: 134,
    _orgNameLength: 11,
    _orgNameStart: 163,
    characterSet: 224,
    encoding: 'utf8',
    name: 'vendor_name',
    columnLength: 1020,
    columnType: 253,
    flags: 20489,
    decimals: 0
  }
]
*/