const dirSql  = $('#dir-sql');
const dirSqlChooseButton = $('#dir-sql-choose');
const saveDirSettingsButton = $('#save-dir-settings-button');
const dirErrorMsg = $('#dir-error-msg');

const sqlUser = $('#sql-user');
const sqlPass = $('#sql-pass');
const sqlHost = $('#sql-host');
const sqlDb   = $('#sql-db');
const saveSqlSettingsButton = $('#save-sql-settings-button');

const sshEnabled = $('#ssh-enabled');
const sshUser = $('#ssh-user');
const sshPass = $('#ssh-pass');
const sshHost = $('#ssh-host');
const sshPort = $('#ssh-port');
const sshKey  = $('#ssh-key');
const sshPortRemote = $('#ssh-port-remote');
const sshChooseKeyButton = $('#ssh-choose-key');
const saveSshSettingsButton = $('#save-ssh-settings-button');
const sshErrorMsg = $('#ssh-error-msg');

const settingsPanels = {
  dir: {
    name:   'dir',
    button:   $('#dir-settings-button'),
    panel:    $('#dir-settings-panel'),
    open:   false,
    toggle: () => {
      togglePanel(settingsPanels.dir);
    }
  },
  ssh: {
    name:   'ssh',
    button:   $('#ssh-settings-button'),
    panel:    $('#ssh-settings-panel'),
    open:   false,
    toggle: () => {
      togglePanel(settingsPanels.ssh);
    }
  },
  sql: {
    name:   'sql',
    button:   $('#sql-settings-button'),
    panel:    $('#sql-settings-panel'),
    open:   false,
    toggle: () => {
      togglePanel(settingsPanels.sql);
    }
  },
  info: {
    name:   'info',
    button:   $('#info-button'),
    panel:    $('#info-panel'),
    open:   false,
    toggle: () => {
      togglePanel(settingsPanels.info);
    }
  }
}

let preferences = {};

let settingsPanelOpen = false;

function showSettings() {
  settingsPanelOpen = true;
  settingsPanel.css('display', 'block');
  sidebar.addClass('settings-open');
  contentArea.addClass('settings-open');
  infoArea.addClass('settings-open');
}
function hideSettings() {
  settingsPanelOpen = false;
  settingsPanel.css('display', 'none');
  sidebar.removeClass('settings-open');
  contentArea.removeClass('settings-open');
  infoArea.removeClass('settings-open');
}
function hideOpenSettings(keep) {
  Object.keys(settingsPanels).map((p, i) => {
    if (settingsPanels[p].name != keep) {
      settingsPanels[p].panel.css('display', 'none');
      settingsPanels[p].button.removeClass('open');
      settingsPanels[p].open = false;
    }
  });
}

settingsPanels.dir.button.on('click',settingsPanels.dir.toggle);
settingsPanels.ssh.button.on('click',settingsPanels.ssh.toggle);
settingsPanels.sql.button.on('click',settingsPanels.sql.toggle);
settingsPanels.info.button.on('click',settingsPanels.info.toggle);
function togglePanel(p) {
  if (p.open) {
    p.panel.css('display', 'none');
    p.button.removeClass('open');
    p.open = false;
    hideSettings();
  }
  else if (settingsPanelOpen) {
    hideOpenSettings(p.name);
    p.panel.css('display', 'block');
    p.button.addClass('open');
    p.open = true;
  }
  else {
    showSettings();
    p.panel.css('display', 'block');
    p.button.addClass('open');
    p.open = true;
  }
}

ipcRenderer.on('reply-preferences',(event, section, newPrefs) => {
  preferences[section] = newPrefs;
  switch (section) {
    case 'sqlDir':
      dirSql.val(newPrefs);
      testDirPrefs();
      break;
    case 'sql':
      sqlUser.val(newPrefs.user);
      sqlPass.val(newPrefs.pass);
      sqlHost.val(newPrefs.host);
      sqlDb.val(newPrefs.db);
      testSqlPrefs();
      break;
    case 'sshEnabled':
      sshEnabled.prop('checked',newPrefs);
      break;
    case 'ssh':
      sshHost.val(newPrefs.host);
      sshPort.val(newPrefs.port);
      sshUser.val(newPrefs.user);
      sshPass.val(newPrefs.pass);
      sshKey.val(newPrefs.key);
      sshPortRemote.val(newPrefs.remotePort);
      testSshPrefs();
      break;
    default:
      showError('Undefined preferences set: ' + section);
  }
});

ipcRenderer.send('get-preferences','sqlDir');
ipcRenderer.send('get-preferences','sql');
ipcRenderer.send('get-preferences','sshEnabled');
ipcRenderer.send('get-preferences','ssh');

let dirStart = false;
let sqlStart = false;
let sshStart = false;

function testDirPrefs() {
  if (!preferences.sqlDir) {
    openStartDir();
    return false;
  }
  else {
    closeStartDir();
    return true;
  }
}
function testSqlPrefs() {
  if (!preferences.sql.user || !preferences.sql.pass || !preferences.sql.host || !preferences.sql.db) {
    openStartSql();
    return false;
  }
  else {
    closeStartSql();
    return true;
  }
}
function testSshPrefs() {
  if (preferences.sshEnabled && (!preferences.ssh.host || !preferences.ssh.port || !preferences.ssh.remotePort || !preferences.ssh.user || (!preferences.ssh.pass && !preferences.ssh.key))) {
    openStartSsh();
    return false;
  }
  else {
    closeStartSsh();
    return true;
  }
}

function openStart() {
  startArea.css('display','block');
  codeArea.css('display','none');
  infoArea.css('display','none');
}
function openStartDir() {
  dirStart = true;
  openStart();
  startDir.css('display','block');
}
function openStartSql() {
  sqlStart = true;
  openStart();
  startSql.css('display','block');
}
function openStartSsh() {
  sshStart = true;
  openStart();
  startSsh.css('display','block');
}
function tryCloseStart() {
  if (!dirStart && !sqlStart && !sshStart) {
    startArea.css('display','none');
    codeArea.css('display','block');
    infoArea.css('display','flex');
  }
}
function closeStartDir() {
  dirStart = false;
  startDir.css('display','none');
  tryCloseStart();
}
function closeStartSql() {
  sqlStart = false;
  startSql.css('display','none');
  tryCloseStart();
}
function closeStartSsh() {
  sshStart = false;
  startSsh.css('display','none');
  tryCloseStart();
}

ipcRenderer.on('preferences-updated', (event, section, newPrefs) => {
  preferences[section] = newPrefs;
  switch (section) {
    case 'sqlDir':
      console.log('Dir Settings Saved');
      saveDirSettingsButton.text('Saved');
      tryRefreshList();
      setTimeout(() => {
        saveDirSettingsButton.attr('disabled',false).removeClass('disabled').text('Save');
      }, 500);
      break;
    case 'sql':
      console.log('SQL Settings Saved');
      saveSqlSettingsButton.text('Saved');
      testSqlPrefs();
      setTimeout(() => {
        saveSqlSettingsButton.attr('disabled',false).removeClass('disabled').text('Save');
      }, 500);
      break;
    case 'sshEnabled':
      console.log('SSH Enabled Toggled');
      testSshPrefs();
      break;
    case 'ssh':
      console.log('SSH Settings Saved');
      saveSshSettingsButton.text('Saved');
      testSshPrefs();
      setTimeout(() => {
        saveSshSettingsButton.attr('disabled',false).removeClass('disabled').text('Save');
      }, 500);
      break;
    default:
      showError('Undefined preferences set updated: ' + section);
  }
});

function tryRefreshList() {
  let testDir = testDirPrefs();
  let testSql = testSqlPrefs();
  let testSsh = testSshPrefs();
  if (testDir && testSql && testSsh) {
    noQueriesMsg.css('display','none');
    clearCurrentQuery();
    listQueries();
  }
}

dirSqlChooseButton.on('click',(event) => {
  ipcRenderer.send('choose-sql-dir');
});
ipcRenderer.on('sql-dir-chosen',(event, filename) => {
  if (filename) {
    dirSql.val(filename);
  }
});

saveDirSettingsButton.on('click',() => {
  sqlList.text(' ');
  dirErrorMsg.text(' ');
  saveDirSettingsButton.attr('disabled',true).addClass('disabled').text('...');
  ipcRenderer.send('update-preferences','sqlDir', dirSql.val());
});
ipcRenderer.on('sql-dir-not-found',(event) => {
  setTimeout(() => {
    saveDirSettingsButton.attr('disabled',false).removeClass('disabled').text('Save');
    dirErrorMsg.text('Directory not found');
  }, 1000);
});

saveSqlSettingsButton.on('click',() => {
  saveSqlSettingsButton.attr('disabled',true).addClass('disabled').text('...');
  let sqlSettings = {
    user: sqlUser.val(),
    pass: sqlPass.val(),
    host: sqlHost.val(),
    db: sqlDb.val()
  }
  ipcRenderer.send('update-preferences','sql', sqlSettings);
});

sshEnabled.on('click',() => {
  let checked = sshEnabled.prop('checked');
  ipcRenderer.send('update-preferences','sshEnabled', checked);
});

saveSshSettingsButton.on('click',() => {
  sshErrorMsg.text(' ');
  saveSshSettingsButton.attr('disabled',true).addClass('disabled').text('...');
  let sshSettings = {
    host: sshHost.val(),
    port: sshPort.val(),
    user: sshUser.val(),
    pass: sshPass.val(),
    key: sshKey.val(),
    remotePort: sshPortRemote.val()
  }
  ipcRenderer.send('update-preferences','ssh', sshSettings);
});
ipcRenderer.on('ssh-key-not-found',(event) => {
  setTimeout(() => {
    saveSshSettingsButton.attr('disabled',false).removeClass('disabled').text('Save');
    sshErrorMsg.text('SSH Key not found');
  }, 1000);
});

sshChooseKeyButton.on('click',(event) => {
  ipcRenderer.send('ssh-choose-key');
});
ipcRenderer.on('ssh-key-chosen',(event, filename) => {
  if (filename) {
    sshKey.val(filename);
  }
});

