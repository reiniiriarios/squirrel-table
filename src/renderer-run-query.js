const { inArray } = require("jquery");

let resultsColumnAsc = [];
let sortedColumn;

// sort either alphabetically or numerically
// depending on selectedQuery.fields[columnIndex].display
// set by switch (field.columnType) in main-run-query
let sortAlpha = ['string','json','enum'];
let sortNumeric = ['decimal','int','float','bit'];
let sortTime = ['time'];
let sortableTypes = [...sortAlpha, ...sortNumeric, ...sortTime];

function displayResult() {
  codeArea.css('display', 'none');

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
      if (sortedColumn == columnIndex) {
        if (resultsColumnAsc[columnIndex]) {
          th.classList.add('sort-asc');
        }
        else {
          th.classList.add('sort-desc');
        }
      }
      $(th).on('click', sortResults);
    }
    theadtr.appendChild(th);
  });
  selectedQuery.result.forEach(row => {
    let tr = document.createElement('tr');
    row.forEach((cell, columnIndex) => {
      let td = document.createElement('td');
      td.classList.add('datatype-' + selectedQuery.fields[columnIndex].display);
      if (cell == null) {
        td.innerHTML = '<span class="data-null">null</span>'
      }
      else {
        td.innerText = cell;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  result.css('display', 'block').append(table);
  updateStatus(selectedQuery.result.length + ' results');
  saveButton.attr('disabled', false).css('display', 'inline-block');
  saveXlButton.attr('disabled', false).css('display', 'inline-block');
}

function sortResults(event) {
  let column = $(event.target);
  let columnId = column.attr('data-column');
  let columnType = column.attr('data-type');
  let asc = resultsColumnAsc[columnId] === true;
  for (let i = 0; i < resultsColumnAsc.length; i++) {
    if (i != columnId) {
      resultsColumnAsc[i] = true;
    }
  }
  resultsColumnAsc[columnId] = typeof resultsColumnAsc[columnId] == 'undefined' ? true : !asc;
  sortedColumn = columnId;
  //sort
  let swapping = true;
  let swap = false;
  while (swapping) {
    swapping = false;
    let i = 0;
    let x;
    let y;
    for (i = 0; i < selectedQuery.result.length - 1; i++) {
      swap = false;
      x = selectedQuery.result[i][columnId];
      y = selectedQuery.result[i + 1][columnId];
      // sort alpha
      if (inArray(columnType, sortAlpha) !== -1) {
        let xx = typeof x === 'string' ? x.toLowerCase() : '';
        let yy = typeof y === 'string' ? y.toLowerCase() : '';
        if (asc && x > y) {
          swap = true;
          break;
        }
        else if (!asc && x < y) {
          swap = true;
          break;
        }
      }
      // sort numeric
      else if (inArray(columnType, sortNumeric) !== -1) {
        if (asc && parseFloat(x) > parseFloat(y)) {
          swap = true;
          break;
        }
        else if (!asc && parseFloat(x) < parseFloat(y)) {
          swap = true;
          break;
        }
      }
      // sort time
      else if (inArray(columnType, sortTime) !== -1) {
        let xT = x ? new Date(x).getTime() : 0;
        let yT = y ? new Date(y).getTime() : 0;
        if (asc && xT > yT) {
          swap = true;
          break;
        }
        else if (!asc && xT < yT) {
          swap = true;
          break;
        }
      }
      // else don't try to sort
    }
    if (swap) {
      let tmp = selectedQuery.result[i];
      selectedQuery.result[i] = selectedQuery.result[i + 1]
      selectedQuery.result[i + 1] = tmp;
      swapping = true;
    }
    else {
      result.text(' ');
      displayResult();
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
    saveButton.addClass('running').attr('disabled',true);
    ipcRenderer.send('save-csv', selectedQuery.name, selectedQuery.fields, selectedQuery.result);
  }
}
ipcRenderer.on('csv-saved', (event) => {
  clearStatus(4000);
  saveButton.removeClass('running').attr('disabled',false);
});

saveXlButton.on('click',saveXl);
function saveXl() {
  if (saveXlButton.attr('disabled') == true) {
    return false;
  }
  else {
    updateStatus('Saving File');
    saveXlButton.addClass('running').attr('disabled',true);
    ipcRenderer.send('save-xl', selectedQuery.name, selectedQuery.fields, selectedQuery.result);
  }
}
ipcRenderer.on('xl-saved', (event) => {
  clearStatus(4000);
  saveXlButton.removeClass('running').attr('disabled',false);
});
