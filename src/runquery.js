const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
require('dotenv').config();
const csvParse = require('csv-parse');
const csvStringify = require('csv-stringify');

function sendStatus(status) {
    BrowserWindow.getFocusedWindow().webContents.send('update-status', status);
}

function sshExec(command, callback) {
    sendStatus('Connecting Over SSH');
    ssh.connect({
        host: process.env.SSH_host,
        username: process.env.SSH_user,
        privateKey: process.env.SSH_privatekey
    }).then(() => {
        sendStatus('Executing Query');
        ssh.execCommand(command, { cwd: '/' }).then((result) => {
            if (result.stderr) {
                showError('Remote Server Error: ' + result.stderr);
                return false;
            }
            callback(result.stdout);
        });
    }, function failureHandler(error) {
      showError('Remote Server Error: ' + result.stderr);
      return false;
    });
}

function tsv2array(tsvString, callback) {
    sendStatus('Converting TSV to Array');
    csvParse(tsvString, {
        delimiter: "\t",
        trim: true
    }, (err, csvArray) => {
        if (err) {
            showError('CSV Parsing Error: ' + err.toString());
            return false;
        }
        callback(csvArray);
    });
}
  
function array2csv(data, callback) {
    csvStringify(data, (err, csvString) => {
        if (err) {
            showError('CSV Stringify Error: ' + err.toString());
            return false;
        }
        callback(csvString);
    });
}

function saveCsvString(csvString, defaultName, callback) {
    sendStatus('Saving File')
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
        sendStatus('Saving File to ' + result.filePath);
        fs.writeFile(result.filePath, csvString, (err) => {
            if (err) {
                showError('Error Writing File: ' + err.toString());
            }
            callback(result.filePath);
        });
    }).catch(err => {
        showError('Error Saving File: ' + err.toString());
        callback(false);
    });
}

ipcMain.on('run-query', (event, sql) => {
    sendStatus('Running Query');
    sql = sql.replace(/(?:\r\n|\r|\n)/g, ' ').replace(/(?:\")/g, '\'');
    let mysqlcmd = "mysql -h " + process.env.SQL_host + " -u " + process.env.SQL_user + " -p'" + process.env.SQL_pass + "' " + process.env.SQL_db + " -e \"" + sql + "\"";
    sshExec(mysqlcmd, function(tsvOutput) {
        tsv2array(tsvOutput, function(result) {
            event.reply('query-result', result);
        });
    });
})

ipcMain.on('save-csv', (event, name, data) => {
    sendStatus('Saving File');
    array2csv(data,(csvString) => {
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
                sendStatus('Saved to ' + location);
            }
            event.reply('csv-saved', true);
        });
    });
});