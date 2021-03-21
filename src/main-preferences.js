const { app, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const crypt = require(path.join(__dirname,'main-crypt.js'));

let preferencesFile = path.join(__dirname,'../preferences.json');
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
  let encryptedPrefs = preferences;
  encryptedPrefs.ssh.user = await crypt.encrypt(preferences.ssh.user);
  encryptedPrefs.ssh.pass = await crypt.encrypt(preferences.ssh.pass);
  encryptedPrefs.sql.user = await crypt.encrypt(preferences.sql.user);
  encryptedPrefs.sql.pass = await crypt.encrypt(preferences.sql.pass);
  return encryptedPrefs;
}
async function decryptPrefs(encryptedPrefs) {
  let decryptedPrefs = encryptedPrefs;
  decryptedPrefs.ssh.user = await crypt.decrypt(encryptedPrefs.ssh.user);
  decryptedPrefs.ssh.pass = await crypt.decrypt(encryptedPrefs.ssh.pass);
  decryptedPrefs.sql.user = await crypt.decrypt(encryptedPrefs.sql.user);
  decryptedPrefs.sql.pass = await crypt.decrypt(encryptedPrefs.sql.pass);
  return decryptedPrefs;
}

exports.loadPreferences = async () => {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(preferencesFile)) {
        throw 'Preferences file not found';
      }
      else {
        let preferencesString = fs.readFileSync(preferencesFile);
        let newPrefs = JSON.parse(preferencesString);
        if (typeof preferences.ssh == 'undefined') {
          throw 'Unable to read preferences';
        }
        else {
          decryptPrefs(newPrefs).then(decryptedPrefs => {
            preferences = decryptedPrefs;
            resolve(preferences);
          }).catch(err => { throw err; });
        }
      }
    }
    catch(error) {
      log.error('Error reading preferences, resetting to defaults.');
      writePreferences(preferences).then(() => {
        log.info('Preferences reset');
        resolve(preferences);
      }).catch(err => {
        log.error(err);
      });
    }
  });
}

async function writePreferences(newPrefs) {
  return new Promise((resolve, reject) => {
    preferencesString = JSON.stringify(newPrefs, null, "\t");
    fs.writeFile(preferencesFile, preferencesString, (error) => {
      if (error) {
        reject(error);
      }
      else {
        resolve(newPrefs);
      }
    });
  });
}

async function updatePreferences(section, newPrefs) {
  return new Promise((resolve, reject) => {
    preferences[section] = newPrefs;
    resolve();
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
    updatePreferences(section, newPrefs).then(() => {
      return encryptPrefs();
    }).then(encryptedPrefs => {
      return writePreferences(encryptedPrefs);
    }).then(() => {
      if (section == 'ssh' && newPrefs.key != 'imported_key' && fs.existsSync('imported_key')) {
        fs.unlink('imported_key', (err) => {
          if (err) {
            log.error(err);
          }
        });
      }
      event.reply('preferences-updated', section, newPrefs);
    }).catch(err => {
      log.error(err);
    });
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
        readImportedPrefs(result.filePaths[0]).then(newPrefs => {
          return writePreferences(newPrefs);
        }).then(newPrefs => {
          return decryptPrefs(newPrefs);
        }).then(newPrefsDecrypted => {
          preferences = newPrefsDecrypted;
          event.reply('settings-imported');
          event.reply('reply-preferences','sqlDir',newPrefsDecrypted.sqlDir);
          event.reply('reply-preferences','sql',newPrefsDecrypted.sql);
          event.reply('reply-preferences','sshEnabled',newPrefsDecrypted.sshEnabled);
          event.reply('reply-preferences','ssh',newPrefsDecrypted.ssh);
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
      let newPrefs = {...preferences, ...importedPrefs};
      if (!newPrefs.ssh.encryptedKey) {
        resolve(newPrefs);
      }
      else {
        crypt.decrypt(newPrefs.ssh.encryptedKey).then(decryptedKey => {
          newPrefs.ssh.key = 'imported_key';
          newPrefs.ssh.encryptedKey = '';
          fs.writeFile('imported_key', decryptedKey, (err) => {
            if (err) throw err;
            resolve(newPrefs);
          });
        }).catch(err => { throw err; });
      }
    }
    catch {
      reject(err);
    }
  });
}

ipcMain.on('export-settings',(event) => {
  dialog.showSaveDialog(null, {
    title: "Export Settings",
    defaultPath : app.getPath('desktop') + '/preferences.json',
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
      encryptPrefs(preferences).then(exportPrefs => {
        if (preferences.ssh.key) {
          fs.readFile(preferences.ssh.key, 'utf8', (err, key) => {
            if (err) throw err;
            crypt.encrypt(key).then((encryptedKey) => {
              exportPrefs.ssh.encryptedKey = encryptedKey;
              exportPrefs.ssh.key = '';
              let exportPrefsString = JSON.stringify(exportPrefs,null,"\t");
              fs.writeFile(result.filePath, exportPrefsString, (err) => {
                if (err) throw err;
                event.reply('settings-exported');
              });
            });
          });
        }
        else {
          let exportPrefsString = JSON.stringify(exportPrefs,null,"\t");
          fs.writeFile(result.filePath, exportPrefsString, (err) => {
            if (err) throw err;
            event.reply('settings-exported');
          });
        }
      });
    }
  }).catch(err => {
    log.error(err);
    event.reply('settings-exported'); // still replying because process is done
  });
});