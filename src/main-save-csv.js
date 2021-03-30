const { BrowserWindow, app, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const csvStringify = require('csv-stringify');
const log = require('electron-log');
  
function array2csv(data, callback) {
  csvStringify(data, (err, csvString) => {
    if (err) {
      log.error(err);
      return false;
    }
    callback(csvString);
  });
}

function saveCsvString(csvString, defaultName, callback) {
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'Saving File');
  dialog.showSaveDialog(null, {
    title: "Save CSV",
    defaultPath : app.getPath('desktop') + '/' + defaultName + '.csv',
    buttonLabel : "Save CSV",
    filters :[
      {name: 'CSV', extensions: ['csv']},
      {name: 'All Files', extensions: ['*']}
    ]
  }).then(result => {
    if (result.canceled) {
      callback(false);
    }
    else {
      BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'Writing File');
      fs.writeFile(result.filePath, csvString, (err) => {
        if (err) {
          log.error(err);
          BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', 'Error Writing File');
        }
        callback(result.filePath);
      });
    }
  }).catch(err => {
    log.error(err);
    BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', 'Error Saving File');
    callback(false);
  });
}

ipcMain.on('save-csv', (event, name, fields, result) => {
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'Saving File');
  let head = [];
  fields.forEach((column) => {
    head.push(column.name);
  });
  result.unshift(head);
  array2csv(result,(csvString) => {
    let currentDate = new Date();
    let cY = currentDate.getFullYear();
    let cM = currentDate.getMonth() + 1;
    let cD = currentDate.getDate();
    let cH = currentDate.getHours();
    let cN = currentDate.getMinutes();
    let cS = currentDate.getSeconds();
    name = name.toLowerCase().replace(/(?:[^a-z0-9 ])/g, '').replace(/(?: +)/, '-');
    let filename = name + '-' + cY + cM + cD + '-' + cH + cN + cS;
    saveCsvString(csvString, filename, (location) => {
      if (location) {
        BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'File Saved');
      }
      event.reply('csv-saved', true);
    });
  });
});
