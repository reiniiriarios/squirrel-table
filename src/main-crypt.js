const crypto = require('crypto');
const algorithm = 'aes-192-cbc';
const secret = 's49t8hCTx3hniuc4';

module.exports.encrypt = async (sourceString) => {
  return new Promise((resolve, reject) => {
    try {
      if (!sourceString) resolve('');
      sourceString = sourceString.normalize('NFC');
      let salt = crypto.randomBytes(8).toString('hex');
      crypto.scrypt(secret, salt, 24, (err, key) => {
        if (err) throw err;
        crypto.randomFill(new Uint8Array(16), (err, iv) => {
          if (err) throw err;
          let ivhex = iv.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
          let cipher = crypto.createCipheriv(algorithm, key, iv);
          let encrypted = '';
          cipher.setEncoding('hex');
          cipher.on('data', (chunk) => encrypted += chunk);
          cipher.on('end', () => {
            let final = encrypted + '.' + salt + '.' + ivhex;
            resolve(final);
          });
          cipher.write(sourceString);
          cipher.end();
        });
      });
    }
    catch (err) {
      reject(err);
    }
  });
}

module.exports.decrypt = async (encryptedString) => {
  return new Promise((resolve, reject) => {
    if (!encryptedString) resolve('');
    let parts = encryptedString.split('.');
    let encrypted = parts[0];
    let salt      = parts[1];
    let ivhex     = parts[2];
    if (!ivhex) {
      // assume unencrypted
      resolve(encryptedString);
    }
    let iv = new Uint8Array(ivhex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    crypto.scrypt(secret, salt, 24, (err, key) => {
      if (err) reject(err);
      let decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = '';
      decipher.on('readable', () => {
        while (null !== (chunk = decipher.read())) {
          decrypted += chunk.toString('utf8');
        }
      });
      decipher.on('end', () => {
        resolve(decrypted);
      });
      decipher.write(encrypted, 'hex');
      decipher.end();
    });
  });
}