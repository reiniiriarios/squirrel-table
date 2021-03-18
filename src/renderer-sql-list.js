function clearCurrentQuery() {
  clearResult();
  selectedQuery.name = '';
  selectedQuery.desc = '';
  selectedQuery.sql = '';
  runButton.attr('disabled', true);
  runButton.addClass('disabled');
  codeEditor.text(' ');
  lineNumbersBlock.text(' ');
  comments.text(' ');
}

function clearResult() {
  selectedQuery.result = '';
  result.text(' ');
  result.css('display', 'none');
  codeArea.css('display', 'block');
  saveButton.attr('disabled', true);
  saveButton.css('display', 'none');
}

function listQueries() {
  sqlList.text(' ');
  noQueriesMsg.css('display','none');
  ipcRenderer.send('list-queries');
}
ipcRenderer.on('sql-list',(event,sqlfiles) => {
  const sqlListItemTemplate = $('#sqlListItemTemplate').html();
  if (sqlfiles.length) {
    sqlfiles.forEach(name => {
      let li = $(sqlListItemTemplate);
      li.find('.button-text').text(name);
      let button = li.find('button');
      button.data('query', name);
      button.on('click',showQuery);
      li.appendTo(sqlList);

      closeStartDir();
      noQueriesMsg.css('display','none');
    });
  }
  else {
    openStartDir();
    noQueriesMsg.css('display','block');
  }
});
ipcRenderer.on('no-dir',(event) => {
  openStartDir();
  noQueriesMsg.css('display','block');
});

function showQuery() {
  clearResult();

  $('.sqlbutton').removeClass('selected');
  $(this).addClass('selected');
  
  let name = $(this).data('query');
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
  codeEditor.html(sqlHighlighted);

  let displayedLines = selectedQuery.sql.split(/\r\n|\r|\n/).length;
  let lineNumbers = '';
  for (let i = 1; i <= displayedLines; i++) {
    lineNumbers += i + '<br>';
  };
  lineNumbersBlock.html(lineNumbers);

  if (selectedQuery.desc) {
    selectedQuery.desc = selectedQuery.desc.replace(/(?:\r\n|\r|\n)/g, ' ').trim();
    comments.innerText = selectedQuery.desc;
  }
  else {
    comments.html('<em>none</em>');
  }

  runButton.attr('disabled', false);
  runButton.removeClass('disabled');
}

try {
  setTimeout(() => {
    if (testDirPrefs() && testSqlPrefs() && testSshPrefs()) {
      listQueries();
    }
  },500);
}
catch (err) {
  showError(err.toString());
}