const { inArray } = require("jquery");

let resultsColumnAsc = [];
let resultsTable;

// sort either alphabetically or numerically
// depending on selectedQuery.fields[columnIndex].display
// set by switch (field.columnType) in main-run-query
let sortAlpha = ['string','json','enum'];
let sortNumeric = ['decimal','int','float','bit'];
let sortTime = ['time'];
let sortableTypes = [...sortAlpha, ...sortNumeric, ...sortTime];

function displayResult() {
  codeArea.css('display', 'none');
  resultsColumnAsc = [];

  let table = document.createElement("table");
  table.id = 'results-table';
  let thead = document.createElement('thead');
  table.appendChild(thead);
  let theadtr = document.createElement('tr');
  thead.appendChild(theadtr);
  let tbody = document.createElement('tbody');
  table.appendChild(tbody);
  selectedQuery.fields.forEach((column, columnIndex) => {
    let th = document.createElement('th');
    th.innerText = column.name;
    th.classList.add('results-column');
    if (inArray(selectedQuery.fields[columnIndex].display, sortableTypes) !== -1) {
      th.classList.add('sortable');
      th.setAttribute('data-column', columnIndex);
      th.setAttribute('data-type', selectedQuery.fields[columnIndex].display);
      resultsColumnAsc[columnIndex] = true;
      $(th).on('click', event => { sortResults($(event.target)); });
    }
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

  result.css('display', 'block').append(table);
  resultsTable = table;
  updateStatus('Done');
  saveButton.attr('disabled', false).css('display', 'inline-block');
}

function sortResults(column) {
  //column
  let columnId = column.attr('data-column');
  let columnType = column.attr('data-type');
  let asc = resultsColumnAsc[columnId];
  for (let i = 0; i < resultsColumnAsc.length; i++) {
    resultsColumnAsc[i] = true;
  }
  resultsColumnAsc[columnId] = !asc;
  $('.results-column').removeClass('sort-asc').removeClass('sort-desc');
  if (asc) {
    column.addClass('sort-asc');
  }
  else {
    column.addClass('sort-desc');
  }
  //sort
  let rows;
  let swapping = true;
  let swap = false;
  while (swapping) {
    swapping = false;
    rows = resultsTable.rows;
    let i = 1;
    for (i = 1; i < (rows.length - 1); i++) {
      swap = false;
      x = rows[i].cells[columnId];
      y = rows[i + 1].cells[columnId];
      // sort alpha, numeric, and time differently
      if (inArray(columnType, sortAlpha) !== -1) {
        if (asc && x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          swap = true;
          break;
        }
        else if (!asc && x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          swap = true;
          break;
        }
      }
      else if (inArray(columnType, sortNumeric) !== -1) {
        if (asc && parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) {
          swap = true;
          break;
        }
        else if (!asc && parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
          swap = true;
          break;
        }
      }
      else if (inArray(columnType, sortTime) !== -1) {
        let xT = new Date(x.innerHTML);
        let yT = new Date(y.innerHTML);
        if (asc && xT.getTime() > yT.getTime()) {
          swap = true;
          break;
        }
        else if (!asc && xT.getTime() < yT.getTime()) {
          swap = true;
          break;
        }
      }
      // else don't try to sort
    }
    if (swap) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      swapping = true;
    }
  }
}

editButton.on('click',editQuery);
function editQuery() {
  ipcRenderer.send('edit-query', selectedQuery.name);
  editButton.attr('disabled', true).addClass('disabled').css('display', 'inline-block');
}
ipcRenderer.on('edit-query-sent',event => {
  editButton.attr('disabled', false).removeClass('disabled').css('display', 'inline-block');
})

runButton.on('click',runQuery);
function runQuery() {
  if (this.disabled == true) return false;
  clearResult();
  saveButton.attr('disabled', true).css('display', 'none');
  runButton.addClass('running').attr('disabled', true);
  editButton.attr('disabled', true).addClass('disabled').css('display', 'inline-block');
  updateStatus('Running Query');
  ipcRenderer.send('run-query', selectedQuery.sql);
}
ipcRenderer.on('query-result', (event, fields, results) => {
  updateStatus('Rendering Result');
  selectedQuery.result = results;
  selectedQuery.fields = fields;
  displayResult();
  clearStatus();
  runButton.removeClass('running').attr('disabled', false);
  editButton.attr('disabled', true).addClass('disabled').css('display', 'none');
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