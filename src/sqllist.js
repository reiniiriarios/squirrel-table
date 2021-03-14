const {ipcRenderer} = require('electron');
const path = require('path');
const fs = require('fs');
const { highlight } = require('sql-highlight');

const titleBar = document.getElementById('titlebar');
ipcRenderer.send('init-variables');
ipcRenderer.on('init-reply',(event, data) => {
  const appName = data.appName;
  const appVersion = data.appVersion;
  const resources = data.resources;
  console.log(resources);
  titleBar.innerText = appName + ' - v' + appVersion;
  document.title = appName;
});

const ul = document.getElementById('sqllist');
const queryWin = document.getElementById('queryWin');
const codeArea = queryWin.querySelector('code');
const comments = queryWin.querySelector('#comments');
const runButton = document.getElementById('run');
const saveButton = document.getElementById('save');
const sqlListItemTemplate = document.querySelector('#sqlListItemTemplate');
const refreshButton = document.getElementById('refresh');
const closeButton = document.getElementById('close');
const maxButton = document.getElementById('maximize');
const minButton = document.getElementById('minimize');
const result = document.getElementById('result');
const statusText = document.getElementById('status');

refreshButton.addEventListener('click',refreshList,false);
closeButton.addEventListener('click',closeApp,false);
maxButton.addEventListener('click',maximizeApp,false);
minButton.addEventListener('click',minimizeApp,false);
runButton.addEventListener('click',runQuery,false);
saveButton.addEventListener('click',saveCSV,false);

var selectedQuery = {
  name:'',
  desc:'',
  sql:'',
  result:''
};

showError = function(message) {
  console.log(message);
  errorStatus(message);
  dialog.showErrorBox('Oops! Something went wrong.', message);
}

function closeApp() {
  ipcRenderer.invoke('close-app');
}
function minimizeApp() {
  ipcRenderer.invoke('minimize-app');
}
function maximizeApp() {
  ipcRenderer.invoke('maximize-app');
}

function refreshList() {
  clearCurrentQuery();
  listQueries();
  clearResult();
}

function clearCurrentQuery() {
  selectedQuery.name = '';
  selectedQuery.desc = '';
  selectedQuery.sql = '';
  runButton.disabled = true;
  runButton.classList.add('disabled');
  saveButton.disabled = true;
  saveButton.style.display = 'none';
  codeArea.innerText = '';
  comments.innerText = '';
}

function clearResult() {
  selectedQuery.result = '';
  result.innerText = '';
  result.style.display = 'none';
  codeArea.style.display = 'block';
}

function updateStatus(status) {
  statusText.innerText = status;
}
function errorStatus(status) {
  statusText.innerHTML = '<span class="err">' + status + '</span>';
}
function clearStatus(timeout=2000) {
  setTimeout(() => {
    statusText.innerText = '';
  }, timeout);
}
ipcRenderer.on('update-status', (event, status) => {
  updateStatus(status);
});
ipcRenderer.on('error-status', (event, status) => {
  errorStatus(status);
});

function listQueries() {
  ul.innerText = '';
  let sqlfiles = [];
  let files = fs.readdirSync('sql/');
  files.forEach(file => {
    if (path.extname(file) == ".sql") {
      let name = path.basename(file, '.sql');
      sqlfiles.push(name);
    }
  });
  sqlfiles.sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });
  sqlfiles.forEach(name => {
      let sqlListItem = sqlListItemTemplate.content.cloneNode(true);
      let li = sqlListItem.querySelector('li');
      let text = li.querySelector('.button-text');
      text.appendChild(document.createTextNode(name));
      let button = li.querySelector('button');
      button.dataset.query =  name;
      button.addEventListener('click',showQuery,false);
      ul.appendChild(li);
  });
}

function showQuery() {
  clearResult();
  let name = this.dataset.query;
  let allButtons = document.querySelectorAll('.sqlbutton');
  allButtons.forEach(btn => {
    btn.classList.remove('selected');
  });
  this.classList.add('selected');
  selectedQuery.name = name;
  selectedQuery.sql = '';
  selectedQuery.desc = '';
  let sql = fs.readFileSync('sql/' + name + '.sql');
  let lines = sql.toString().split(/\r\n|\r|\n/);
  lines.forEach((line) => {
      if (line.substr(0,2) == '--') {
        selectedQuery.desc += line.substr(2);
      }
      else {
        selectedQuery.sql += line + "\n";
      }
  });
  selectedQuery.sql = selectedQuery.sql.trim();
  let sqlHighlighted = highlight(selectedQuery.sql, {
    html: true
  });
  sqlHighlighted = sqlHighlighted.replace(/(?:\r\n|\r|\n)/g, '<br>').replace(/(?:\t)/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  codeArea.innerHTML = sqlHighlighted;

  if (selectedQuery.desc) {
    selectedQuery.desc = selectedQuery.desc.replace(/(?:\r\n|\r|\n)/g, ' ').trim();
    comments.innerText = selectedQuery.desc;
  }
  else {
    comments.innerHTML = '<em>none</em>';
  }
  runButton.disabled = false;
  runButton.classList.remove('disabled');
}

function displayResult() {
    codeArea.style.display = 'none';
    let table = document.createElement("table");
    let thead = document.createElement('thead');
    table.appendChild(thead);
    let theadtr = document.createElement('tr');
    thead.appendChild(theadtr);
    let tbody = document.createElement('tbody');
    table.appendChild(tbody);
    let header = selectedQuery.result.shift();
    header.forEach(cell => {
      let th = document.createElement('th');
      th.innerText = cell;
      theadtr.appendChild(th);
    });
    selectedQuery.result.forEach(row => {
      let tr = document.createElement('tr');
      row.forEach(cell => {
        let td = document.createElement('td');
        td.innerText = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    result.style.display = 'block';
    result.appendChild(table);
    updateStatus('Done');
    saveButton.disabled = false;
    saveButton.style.display = 'inline-block';
}

function runQuery() {
  if (this.disabled == true) return false;
  clearResult();
  saveButton.disabled = true;
  saveButton.style.display = 'none';
  runButton.classList.add('running');
  runButton.disabled = true;
  updateStatus('Running Query');
  ipcRenderer.send('run-query', selectedQuery.sql);
}
ipcRenderer.on('query-result', (event, result) => {
  if (result) {
    updateStatus('Rendering Result');
    selectedQuery.result = result;
    displayResult();
  }
  else {
    errorStatus('Empty Result');
  }
  clearStatus();
  runButton.classList.remove('running');
  runButton.disabled = false;
});

function saveCSV() {
  if (this.disabled == true) return false;
  updateStatus('Saving File');
  saveButton.classList.add('running');
  ipcRenderer.send('save-csv', selectedQuery.name, selectedQuery.result);
}
ipcRenderer.on('csv-saved', (event) => {
  clearStatus(4000);
  saveButton.classList.remove('running');
});

try {
  listQueries();
}
catch (err) {
  showError(err.toString());
}