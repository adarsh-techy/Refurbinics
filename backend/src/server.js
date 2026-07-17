const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

// Self-signed dev cert (see certs/). Served *alongside* plain http, not
// instead of it: the web frontend needs https for getUserMedia (browsers
// refuse camera access on a non-secure LAN origin), but the Expo mobile app
// uses its own native camera module (expo-camera) — it never needed https,
// and React Native rejects self-signed certs outright with no click-through
// trust flow like a browser has. Forcing https-only broke mobile for no
// benefit, so both protocols run at once on separate ports.
const CERT_DIR = path.join(__dirname, '..', 'certs');
const KEY_PATH = path.join(CERT_DIR, 'key.pem');
const CERT_PATH = path.join(CERT_DIR, 'cert.pem');

async function start() {
  try {
    await db.query('SELECT 1');
    console.log(`Connected to PostgreSQL database "${env.db.name}"`);
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  http.createServer(app).listen(env.port, () => {
    console.log(`Refurbinics API running on port ${env.port} [${env.nodeEnv}] (http)`);
  });

  const hasCert = fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH);
  if (hasCert) {
    https
      .createServer({ key: fs.readFileSync(KEY_PATH), cert: fs.readFileSync(CERT_PATH) }, app)
      .listen(env.httpsPort, () => {
        console.log(`Refurbinics API also running on port ${env.httpsPort} [${env.nodeEnv}] (https)`);
      });
  }
}

start();
