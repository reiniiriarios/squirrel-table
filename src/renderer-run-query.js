function displayResult() {
  codeArea.css('display', 'none');

  let table = document.createElement("table");
  let thead = document.createElement('thead');
  table.appendChild(thead);
  let theadtr = document.createElement('tr');
  thead.appendChild(theadtr);
  let tbody = document.createElement('tbody');
  table.appendChild(tbody);
  selectedQuery.fields.forEach(column => {
    let th = document.createElement('th');
    th.innerText = column.name;
    theadtr.appendChild(th);
  });
  selectedQuery.result.forEach(row => {
    let tr = document.createElement('tr');
    row.forEach((cell, columnIndex) => {
      let td = document.createElement('td');
      td.classList.add('datatype-' + selectedQuery.fields[columnIndex].display);
      td.innerText = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  result.css('display', 'block');
  result.append(table);
  updateStatus('Done');
  saveButton.attr('disabled', false);
  saveButton.css('display', 'inline-block');
}

runButton.on('click',runQuery);
function runQuery() {
  if (this.disabled == true) return false;
  clearResult();
  saveButton.attr('disabled', true);
  saveButton.css('display', 'none');
  runButton.addClass('running');
  runButton.attr('disabled', true);
  updateStatus('Running Query');
  ipcRenderer.send('run-query', selectedQuery.sql);
}
ipcRenderer.on('query-result', (event, fields, results) => {
  updateStatus('Rendering Result');
  selectedQuery.result = results;
  selectedQuery.fields = fields;
  displayResult();
  clearStatus();
  runButton.removeClass('running');
  runButton.attr('disabled', false);
});

saveButton.on('click',saveCSV);
function saveCSV() {
  if (saveButton.attr('disabled') == true) {
    return false;
  }
  else {
    updateStatus('Saving File');
    saveButton.addClass('running');
    ipcRenderer.send('save-csv', selectedQuery.name, selectedQuery.fields, selectedQuery.result);
  }
}
ipcRenderer.on('csv-saved', (event) => {
  clearStatus(4000);
  saveButton.removeClass('running');
});