const {ipcRenderer, shell} = require('electron');
const path = require('path');
const fs = require('fs');
const { highlight } = require('sql-highlight');

$(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

const titleBar         = $('#titlebar');
const closeButton      = $('#close');
const maxButton        = $('#maximize');
const minButton        = $('#minimize');
const refreshButton    = $('#refresh');
const sidebar          = $('#sidebar');
const sqlList          = $('#sqllist');
const noQueriesMsg     = $('#no-queries-msg');
const contentArea      = $('#content');
const codeArea         = $('#code-area');
const codeEditor       = $('#code-area code');
const lineNumbersBlock = $('#line-numbers');
const comments         = $('#comments');
const result           = $('#result');
const statusText       = $('#status');
const runButton        = $('#run');
const saveButton       = $('#save');
const infoArea         = $('#info');
const infoName         = $('#info-name');
const infoVersion      = $('#info-version');
const settingsPanel    = $('#settings-panel');
const startArea        = $('#getting-started');
const startDir         = $('#start-dir');
const startSql         = $('#start-sql');
const startSsh         = $('#start-ssh');

ipcRenderer.send('init-variables');
ipcRenderer.on('init-reply',(event, data) => {
  const appName = data.appName;
  const appVersion = data.appVersion;
  titleBar.text(appName + ' - v' + appVersion);
  infoName.text(appName);
  infoVersion.text('v' + appVersion);
  document.title = appName;
});

closeButton.on('click',closeApp);
function closeApp() {
  ipcRenderer.invoke('close-app');
}
minButton.on('click',minimizeApp);
function minimizeApp() {
  ipcRenderer.invoke('minimize-app');
}
maxButton.on('click',maximizeApp);
function maximizeApp() {
  ipcRenderer.invoke('maximize-app');
}

var selectedQuery = {
  name:'',
  desc:'',
  sql:'',
  result:'',
  fields: ''
};