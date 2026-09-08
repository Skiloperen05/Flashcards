import express from 'express';
import { join } from 'node:path';
import timeeditHandler from './api/timeedit.js';
import driveHandler from './api/drive.js';

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';
const rootDir = process.cwd();

// Proxy endpoint for NHH TimeEdit schedules
app.all('/api/timeedit', (req, res) => {
  return timeeditHandler(req, res);
});

// Secure Google Drive file streaming and picker gateway (paywall enforced)
app.use('/api/drive', (req, res) => {
  return driveHandler(req, res);
});

// Serve static assets with HTML extension resolution and directory index
app.use(express.static(rootDir, {
  extensions: ['html'],
  index: 'index.html'
}));

// Route fallback: for unrecognized routes, serve root index.html
app.use((req, res) => {
  res.status(404).sendFile(join(rootDir, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Haugnes Flashcards running on http://${HOST}:${PORT}`);
});
