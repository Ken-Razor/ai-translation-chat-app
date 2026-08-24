const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = '/var/www/apps/vivetalk/data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const MASTER_KEY_FILE = path.join(DATA_DIR, '.master_key.secret');

const masterKey = fs.readFileSync(MASTER_KEY_FILE);

function encryptField(text) {
  if (!text || typeof text !== 'string' || text.startsWith('enc:gcm:')) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return 'enc:gcm:' + iv.toString('hex') + ':' + tag + ':' + encrypted;
}

function hashPassword(password) {
  if (!password || password.startsWith('pbkdf2:')) return password;
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return 'pbkdf2:' + salt + ':' + hash;
}

// 1. Encrypt all existing messages with AES-256-GCM
if (fs.existsSync(MESSAGES_FILE)) {
  const msgs = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  const encryptedMsgs = msgs.map(m => ({
    ...m,
    text: encryptField(m.text),
    originalText: encryptField(m.originalText),
    translatedText: encryptField(m.translatedText),
    audioUri: m.audioUri ? encryptField(m.audioUri) : null,
    imageUri: m.imageUri ? encryptField(m.imageUri) : null,
    _encrypted: 'aes-256-gcm'
  }));
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(encryptedMsgs, null, 2));
  console.log('✅ [MESSAGES ENCRYPTED] Total messages secured:', encryptedMsgs.length);
}

// 2. Hash all existing user passwords with Salted PBKDF2
if (fs.existsSync(USERS_FILE)) {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  const hashedUsers = users.map(u => ({
    ...u,
    password: hashPassword(u.password)
  }));
  fs.writeFileSync(USERS_FILE, JSON.stringify(hashedUsers, null, 2));
  console.log('✅ [PASSWORDS HASHED] Total user passwords secured:', hashedUsers.length);
}
