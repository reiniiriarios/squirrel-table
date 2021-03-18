const { app, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const csvStringify = require('csv-stringify');
const messenger = require(path.join(__dirname,'main-messaging.js'));
  
function array2csv(data, callback) {
    csvStringify(data, (err, csvString) => {
        if (err) {
            messenger.showError('CSV Stringify Error: ' + err.toString());
            return false;
        }
        callback(csvString);
    });
}

function saveCsvString(csvString, defaultName, callback) {
    messenger.sendStatus('Saving File');
    dialog.showSaveDialog(null, {
        title: "Save CSV",
        defaultPath : app.getPath('desktop') + '/' + defaultName + '.csv',
        buttonLabel : "Save CSV",
        filters :[
            {name: 'CSV', extensions: ['csv']},
            {name: 'All Files', extensions: ['*']}
        ]
    }).then(result => {
        if (result.canceled) callback(false);
        messenger.sendStatus('Saving File to ' + result.filePath);
        fs.writeFile(result.filePath, csvString, (err) => {
            if (err) {
                messenger.showError('Error Writing File: ' + err.toString());
            }
            callback(result.filePath);
        });
    }).catch(err => {
        messenger.showError('Error Saving File: ' + err.toString());
        callback(false);
    });
}

ipcMain.on('save-csv', (event, name, fields, result) => {
    messenger.sendStatus('Saving File');
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
                messenger.sendStatus('Saved to ' + location);
            }
            event.reply('csv-saved', true);
        });
    });
});
