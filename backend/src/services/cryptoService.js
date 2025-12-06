const crypto = require('crypto');

/**
 * Crypto Service untuk AES dan RSA Encryption/Decryption
 */

class CryptoService {
  /**
   * Generate RSA Key Pair (2048 bit)
   * @returns {Object} { publicKey, privateKey }
   */
  static generateRSAKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Generate random AES Key (256-bit)
   * @returns {Buffer} AES key
   */
  static generateAESKey() {
    return crypto.randomBytes(32); // 256-bit key
  }

  /**
   * Generate random IV for AES
   * @returns {Buffer} IV
   */
  static generateIV() {
    return crypto.randomBytes(16); // 128-bit IV
  }

  /**
   * Encrypt data dengan AES-256-CBC
   * @param {String|Buffer} data - Data yang akan dienkripsi
   * @param {Buffer} key - AES key
   * @param {Buffer} iv - Initialization Vector
   * @returns {String} Encrypted data (base64)
   */
  static encryptAES(data, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  /**
   * Decrypt data dengan AES-256-CBC
   * @param {String} encryptedData - Encrypted data (base64)
   * @param {Buffer} key - AES key
   * @param {Buffer} iv - Initialization Vector
   * @returns {String} Decrypted data
   */
  static decryptAES(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Encrypt data dengan RSA Public Key
   * @param {Buffer|String} data - Data yang akan dienkripsi
   * @param {String} publicKey - RSA Public Key (PEM format)
   * @returns {String} Encrypted data (base64)
   */
  static encryptRSA(data, publicKey) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    return encrypted.toString('base64');
  }

  /**
   * Decrypt data dengan RSA Private Key
   * @param {String} encryptedData - Encrypted data (base64)
   * @param {String} privateKey - RSA Private Key (PEM format)
   * @returns {Buffer} Decrypted data
   */
  static decryptRSA(encryptedData, privateKey) {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    return decrypted;
  }

  /**
   * Encrypt Private Key dengan password user (untuk disimpan di database)
   * @param {String} privateKey - RSA Private Key
   * @param {String} password - User password
   * @returns {Object} { encryptedPrivateKey, salt, iv }
   */
  static encryptPrivateKey(privateKey, password) {
    // Generate salt untuk key derivation
    const salt = crypto.randomBytes(32);
    
    // Derive encryption key dari password menggunakan PBKDF2
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    // Generate IV
    const iv = crypto.randomBytes(16);
    
    // Encrypt private key
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return {
      encryptedPrivateKey: encrypted,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
    };
  }

  /**
   * Decrypt Private Key dengan password user
   * @param {String} encryptedPrivateKey - Encrypted private key (base64)
   * @param {String} password - User password
   * @param {String} salt - Salt (base64)
   * @param {String} iv - IV (base64)
   * @returns {String} Decrypted private key
   */
  static decryptPrivateKey(encryptedPrivateKey, password, salt, iv) {
    // Derive encryption key dari password
    const saltBuffer = Buffer.from(salt, 'base64');
    const key = crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha256');
    
    // Decrypt private key
    const ivBuffer = Buffer.from(iv, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
    let decrypted = decipher.update(encryptedPrivateKey, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash password dengan bcrypt-like approach
   * @param {String} password 
   * @returns {String} Hashed password
   */
  static hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password
   * @param {String} password 
   * @param {String} hashedPassword 
   * @returns {Boolean}
   */
  static verifyPassword(password, hashedPassword) {
    const [salt, originalHash] = hashedPassword.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  }
}

module.exports = CryptoService;
