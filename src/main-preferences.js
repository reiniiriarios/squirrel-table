const { app, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const messenger = require(path.join(__dirname,'main-messaging.js'));
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
    let key = fs.readFileSync(preferences.ssh.key);
    return key;
  }
  catch (error) {
    messenger.showError(error);
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
        await decryptPrefs(newPrefs).then(decryptedPrefs => {
          preferences = decryptedPrefs;
          return preferences;
        });
      }
    }
  }
  catch(error) {
    console.log(error);
    console.log('Resetting preferences');
    writePreferences().then(() => {
      console.log('Preferences reset');
      return preferences;
    });
  }
}

async function writePreferences(newPrefs) {
  return new Promise((resolve, reject) => {
    preferencesString = JSON.stringify(newPrefs, null, "\t");
    fs.writeFile(preferencesFile, preferencesString, (error) => {
      if (error) {
        messenger.showError(error);
        reject(error);
      }
      else {
        resolve();
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
    }).then((encryptedPrefs) => {
      return writePreferences(encryptedPrefs);
    }).then(() => {
      event.reply('preferences-updated', section, newPrefs);
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
    buttonLabel : "Choose File",
    properties: ["openDirectory"]
  }).then((result) => {
    if (!result.canceled) {
      event.reply('sql-dir-chosen',result.filePaths[0]);
    }
  });
});