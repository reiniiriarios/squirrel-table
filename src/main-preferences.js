const { app, ipcMain, dialog, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const crypt = require(path.join(__dirname,'main-crypt.js'));

let preferencesFile = path.join(app.getPath('userData'), 'preferences.json');
let importedKeyFile = path.join(app.getPath('userData'), 'imported_key');
let preferences = {
  sqlDir: false,
  sshEnabled: false,
  ssh: {
    host: '',
    port: 22,
    user: '',
    pass: '',
    key:  '',
    remotePort: 3306
  },
  sql: {
    host: '',
    user: '',
    pass: '',
    db:   ''
  }
};
let preferencesEncrypted = {
  sqlDir: false,
  sshEnabled: false,
  ssh: {
    host: '',
    port: 22,
    user: '',
    pass: '',
    key:  '',
    remotePort: 3306
  },
  sql: {
    host: '',
    user: '',
    pass: '',
    db:   ''
  }
};

exports.getPreferences = (section=false) => {
  if (section) {
    return preferences[section];
  }
  else {
    return preferences;
  }
}

exports.getSshPrivateKey = () => {
  try {
    if (preferences.ssh.key) {
      let key = fs.readFileSync(preferences.ssh.key);
      return key;
    }
    else {
      return false;
    }
  }
  catch (error) {
    log.error(error);
    return false;
  }
}

async function encryptPrefs() {
  try {
    preferencesEncrypted.ssh.user = await crypt.encrypt(preferences.ssh.user).catch(err => { throw err });
    preferencesEncrypted.ssh.pass = await crypt.encrypt(preferences.ssh.pass).catch(err => { throw err });
    preferencesEncrypted.sql.user = await crypt.encrypt(preferences.sql.user).catch(err => { throw err });
    preferencesEncrypted.sql.pass = await crypt.encrypt(preferences.sql.pass).catch(err => { throw err });
    return false;
  }
  catch (err) {
    return err;
  }
}
async function decryptPrefs() {
  try {
    preferences.ssh.user = await crypt.decrypt(preferencesEncrypted.ssh.user).catch(err => { throw err });
    preferences.ssh.pass = await crypt.decrypt(preferencesEncrypted.ssh.pass).catch(err => { throw err });
    preferences.sql.user = await crypt.decrypt(preferencesEncrypted.sql.user).catch(err => { throw err });
    preferences.sql.pass = await crypt.decrypt(preferencesEncrypted.sql.pass).catch(err => { throw err });
    return false;
  }
  catch (err) {
    return err;
  }
}

exports.loadPreferences = async () => {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(preferencesFile)) {
        throw 'Preferences file not found';
      }
      else {
        let preferencesString = fs.readFileSync(preferencesFile);
        preferencesEncrypted = JSON.parse(preferencesString);
        if (typeof preferencesEncrypted.ssh == 'undefined') {
          throw 'Unable to read preferences';
        }
        else {
          preferences = JSON.parse(preferencesString);
          decryptPrefs().then(err => {
            if (err) reject(err);
            else resolve();
          });
        }
      }
    }
    catch(error) {
      log.error(error);
      log.info('Resetting preferences to default');
      writePreferences(preferences).then(() => {
        log.info('Preferences reset');
        resolve(preferences);
      }).catch(err => {
        reject(err);
      });
    }
  });
}

async function writePreferences() {
  return new Promise((resolve, reject) => {
    preferencesString = JSON.stringify(preferencesEncrypted, null, "\t");
    fs.writeFile(preferencesFile, preferencesString, (error) => {
      if (error) {
        reject(error);
      }
      else {
        resolve(true);
      }
    });
  });
}

ipcMain.on('update-preferences',(event, section, newPrefs) => {
  if (section == 'sqlDir' && newPrefs != '' && !fs.existsSync(newPrefs)) {
    event.reply('sql-dir-not-found');
  }
  else if (section == 'ssh' && newPrefs.key != '' && !fs.existsSync(newPrefs.key)) {
    event.reply('ssh-key-not-found');
  }
  else {
    try {
      preferences[section] = JSON.parse(JSON.stringify(newPrefs));
      preferencesEncrypted[section] = JSON.parse(JSON.stringify(newPrefs));
      encryptPrefs().then(err => {
        if (err) throw err;
        return writePreferences();
      }).then(() => {
        if (section == 'ssh' && preferences.ssh.key != importedKeyFile && fs.existsSync(importedKeyFile)) {
          fs.unlink(importedKeyFile, (err) => {
            if (err) {
              throw err;
            }
          });
        }
        event.reply('preferences-updated', section, preferences[section]);
      });
    }
    catch (err) {
      log.error(err);
      throw err; // handle better
    }
  }
});

ipcMain.on('get-preferences',(event, section) => {
  event.reply('reply-preferences',section,preferences[section]);
});

ipcMain.on('ssh-choose-key',(event) => {
  dialog.showOpenDialog({
    title: "Choose SSH Private Key",
    defaultPath : app.getPath('documents'),
    buttonLabel : "Choose File",
    filters :[
      {name: 'SSH Private Key', extensions: ['id_rsa','key','ppk']},
      {name: 'All Files', extensions: ['*']}
    ]
  }).then((result) => {
    if (!result.canceled) {
      event.reply('ssh-key-chosen',result.filePaths[0]);
    }
  });
});

ipcMain.on('choose-sql-dir',(event) => {
  dialog.showOpenDialog({
    title: "Choose Directory of SQL Files",
    defaultPath : app.getPath('documents'),
    buttonLabel : "Choose Directory",
    properties: ["openDirectory"]
  }).then((result) => {
    if (!result.canceled) {
      event.reply('sql-dir-chosen',result.filePaths[0]);
    }
  });
});

ipcMain.on('test-ssh-key-file-exists', (event, filePath) => {
  let exists = fs.existsSync(filePath);
  event.reply('test-ssh-key-file', exists);
});

ipcMain.on('import-settings',(event) => {
  try {
    dialog.showOpenDialog({
      title: "Import Settings",
      defaultPath : app.getPath('documents'),
      buttonLabel : "Choose File",
      filters :[
        {name: 'JSON', extensions: ['json']},
        {name: 'All Files', extensions: ['*']}
      ]
    }).then((result) => {
      if (result.canceled) {
        event.reply('settings-imported');
      }
      else {
        readImportedPrefs(result.filePaths[0]).then(() => {
          return writePreferences();
        }).then(() => {
          return decryptPrefs();
        }).then(() => {
          event.reply('settings-imported');
          event.reply('reply-preferences','sqlDir',preferences.sqlDir);
          event.reply('reply-preferences','sql',preferences.sql);
          event.reply('reply-preferences','sshEnabled',preferences.sshEnabled);
          event.reply('reply-preferences','ssh',preferences.ssh);
        }).catch(err => { throw err; });
      }
    });
  }
  catch (err) {
    log.error(err);
    event.reply('settings-imported');
  }
});
async function readImportedPrefs(filePath) {
  return new Promise((resolve, reject) => {
    try {
      let importedPrefsString = fs.readFileSync(filePath);
      let importedPrefs = JSON.parse(importedPrefsString);
      // only import specific sections
      preferencesEncrypted = {...preferencesEncrypted, ...{sql:importedPrefs.sql}, ...{ssh:importedPrefs.ssh}, ...{sshEnabled:importedPrefs.sshEnabled}};
      if (!preferencesEncrypted.ssh.encryptedKey) {
        resolve();
      }
      else {
        crypt.decrypt(preferencesEncrypted.ssh.encryptedKey).then(decryptedKey => {
          preferencesEncrypted.ssh.key = importedKeyFile;
          preferencesEncrypted.ssh.encryptedKey = '';
          fs.writeFile(importedKeyFile, decryptedKey, (err) => {
            if (err) throw err;
            resolve();
          });
        });
      }
    }
    catch {
      reject(err);
    }
  });
}

ipcMain.on('export-settings',(event) => {
  try {
  dialog.showSaveDialog(null, {
    title: "Export Settings",
    defaultPath : path.join(app.getPath('desktop'), 'preferences.json'),
    buttonLabel : "Save File",
    filters :[
      {name: 'JSON', extensions: ['json']},
      {name: 'All Files', extensions: ['*']}
    ]
  }).then(result => {
    if (result.canceled) {
      event.reply('settings-exported');
    }
    else {
      // only export these sections (and ssh key, encrypted separately)
      encryptPrefs().then(err => {
        if (err) throw err;
        let preferencesLimited = {
          sql: preferencesEncrypted.sql,
          ssh: preferencesEncrypted.ssh,
          sshEnabled: preferencesEncrypted.sshEnabled
        };
        if (preferencesLimited.ssh.key) {
          fs.readFile(preferencesLimited.ssh.key, 'utf8', (err, key) => {
            if (err) throw err;
            crypt.encrypt(key).then((encryptedKey) => {
              preferencesLimited.ssh.encryptedKey = encryptedKey;
              preferencesLimited.ssh.key = '';
              let exportPrefsString = JSON.stringify(preferencesLimited,null,"\t");
              fs.writeFile(result.filePath, exportPrefsString, (err) => {
                if (err) throw err;
                event.reply('settings-exported');
              });
            });
          });
        }
        else {
          let exportPrefsString = JSON.stringify(preferencesLimited,null,"\t");
          fs.writeFile(result.filePath, exportPrefsString, (err) => {
            if (err) throw err;
            event.reply('settings-exported');
          });
        }
      });
    }
  }).catch(err => { throw err });
  }
  catch (err) {
    log.error(err); // handle better
    event.reply('settings-exported'); // still need to reply because process is done
  }
});