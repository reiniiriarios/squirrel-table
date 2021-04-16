const { BrowserWindow, app, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const xl = require('excel4node');

function createXl(name, fields, data, filepath) {
  return new Promise((resolve, reject) => {
    try {
      let wb = new xl.Workbook({
        defaultFont: {
          size: 12,
          name: 'Calibri',
          color: '#000000', //FFFFFFFF
        },
        dateFormat: 'yyyy-mm-dd hh:mm:ss',
        author: 'SquirrelTable', // Name for use in features such as comments
      });
      let ws = wb.addWorksheet(name);
    
      let fieldsStyle = wb.createStyle({
        font: {
          color: '#FFFFFF'
        },
        fill: {
          type: 'pattern',
          patternType: 'solid',
          bgColor: '#555555',
          fgColor: '#555555'
        }
      });
      let intStyle = wb.createStyle({
        font: {
          color: '#0066CC'
        }
      });
      let decimalStyle = wb.createStyle({
        font: {
          color: '#6600CC'
        }
      });
      let floatStyle = wb.createStyle({
        font: {
          color: '#CC0066'
        }
      });
      let dateStyle = wb.createStyle({
        font: {
          color: '#008080'
        }
      });
      let bitStyle = wb.createStyle({
        font: {
          color: '#CC6600'
        }
      });
      let enumStyle = wb.createStyle({
        font: {
          color: '#008800'
        }
      });
      let jsonStyle = wb.createStyle({
        font: {
          color: '#404040'
        }
      });
      let nullStyle = wb.createStyle({
        font: {
          color: '#888888'
        }
      });
      let errorStyle = wb.createStyle({
        font: {
          color: '#FF0000'
        }
      });

      let col_widest = [];
      (async function (){
        fields.forEach((column, fi) => {
          ws.cell(1,fi + 1).string(column.name).style(fieldsStyle);
          col_widest[fi + 1] = column.name.length;
        });
        let cell_row;
        let cell_col;
        let cell_width;
        data.forEach((row, ri) => {
          cell_row = ri + 2;
          row.forEach((value, ci) => {
            cell_col = ci + 1;
            if (typeof value == 'undefined') {
              ws.cell(cell_row,cell_col).string('undefined').style(errorStyle);
              cell_width = 9;
            }
            else if (value == null) {
              ws.cell(cell_row,cell_col).string('');
              cell_width = 4;
            }
            else {
              switch (fields[ci].display) {
                case 'int':
                  ws.cell(cell_row,cell_col).number(parseInt(value)).style(intStyle);
                  cell_width = value.toString().length;
                  break;
                case 'decimal':
                  ws.cell(cell_row,cell_col).number(parseFloat(value)).style(decimalStyle);
                  cell_width = value.toString().length;
                  break;
                case 'float':
                  ws.cell(cell_row,cell_col).number(parseFloat(value)).style(floatStyle);
                  cell_width = value.toString().length;
                  break;
                case 'time':
                  ws.cell(cell_row,cell_col).date(new Date(value)).style(dateStyle);
                  cell_width = 18;
                  break;
                case 'string':
                  ws.cell(cell_row,cell_col).string(value);
                  cell_width = value.length;
                  break;
                case 'json':
                  ws.cell(cell_row,cell_col).string(value).style(jsonStyle);
                  cell_width = value.length;
                  break;
                case 'enum':
                  ws.cell(cell_row,cell_col).string(value).style(enumStyle);
                  cell_width = value.length;
                  break;
                case 'bit':
                  ws.cell(cell_row,cell_col).string(value).style(bitStyle);
                  cell_width = value.length;
                  break;
                case 'blob':
                  ws.cell(cell_row,cell_col).string(value.toString()); // relying on user responsibility lol; blob can be text... or not
                  cell_width = value.length;
                  break;
                default:
                  ws.cell(cell_row,cell_col).string('unable to parse').style(errorStyle);
                  cell_width = 15;
              }
            }
            col_widest[cell_col] = (col_widest[cell_col] > cell_width) ? col_widest[cell_col] : cell_width;
          });
        });

      })().then(() => {
        col_widest.forEach((width, column) => {
          if (width > 40) width = 40;
          ws.column(column).setWidth(width + 3);
        });
        ws.row(1).filter();

        BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'Writing File');
        // stats is an fs.Stats obj
        wb.write(filepath, (err, stats) => {
          if (err) throw err;
          else resolve();
        });
      }).catch(err => { throw err });
    }
    catch(err) {
      reject(err);
    }
  });
}

function saveXl(defaultName, callback) {
  dialog.showSaveDialog(null, {
    title: "Save Excel Document",
    defaultPath : path.join(app.getPath('desktop'), defaultName + '.xlsx'),
    buttonLabel : "Save File",
    filters :[
      {name: 'Excel Workbook', extensions: ['xlsx']},
      {name: 'All Files', extensions: ['*']}
    ]
  }).then(result => {
    if (result.canceled) {
      callback(false);
    }
    else {
      callback(result.filePath);
    }
  }).catch(err => {
    log.error(err);
    BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', 'Error Saving File');
    callback(false);
  });
}

ipcMain.on('save-xl', (event, name, fields, result) => {
  BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'Saving File');
  let currentDate = new Date();
  let cY = currentDate.getFullYear();
  let cM = currentDate.getMonth() + 1;
  let cD = currentDate.getDate();
  let cH = currentDate.getHours();
  let cN = currentDate.getMinutes();
  let cS = currentDate.getSeconds();
  let filename = name.toLowerCase().replace(/(?:[^a-z0-9 ])/g, '').replace(/(?: +)/g, '-') + '-' + cY + cM + cD + '-' + cH + cN + cS;
  saveXl(filename, (location) => {
    if (location) {
      BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'Creating File');
      createXl(name, fields, result, location).then(() => {
        BrowserWindow.fromId(global.mainWindowId).webContents.send('update-status', 'File Saved');
        event.reply('xl-saved', true);
      }).catch(err => {
        log.error(err);
        BrowserWindow.fromId(global.mainWindowId).webContents.send('error-status', 'Error Saving File');
        event.reply('xl-saved', true);
      });
    }
    else {
      event.reply('xl-saved', true);
    }
  });
});
