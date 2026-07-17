import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  // basicSsl auto-generates a self-signed cert so the dev server serves
  // https:// — camera access (getUserMedia, used by the QR scanner) is
  // blocked by browsers on any non-secure origin except localhost, which
  // otherwise breaks it when testing from a phone/other device over the
  // LAN. The browser will show a one-time untrusted-certificate warning to
  // click through (self-signed, expected in dev).
  plugins: [react(), basicSsl()],
  server: {
    host: true,
  },
})
