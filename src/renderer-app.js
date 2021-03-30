// SquirrelTable
// Copyright (C) 2021 Emma Litwa-Vulcu
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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