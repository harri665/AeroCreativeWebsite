const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const MODELS_DIR = path.join(__dirname, 'public', 'models');

app.use(cors());
app.use(express.json());

// Serve static STL files
app.use('/models', express.static(MODELS_DIR));

// List all STL models
app.get('/api/models', (req, res) => {
  // Ensure directory exists
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(MODELS_DIR)
    .filter(f => f.toLowerCase().endsWith('.stl'))
    .map(f => {
      const stats = fs.statSync(path.join(MODELS_DIR, f));
      return {
        name: f.replace(/\.stl$/i, '').replace(/[_-]/g, ' '),
        filename: f,
        url: `/models/${encodeURIComponent(f)}`,
        size: stats.size,
        modified: stats.mtime,
      };
    })
    .sort((a, b) => new Date(b.modified) - new Date(a.modified));

  res.json(files);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/time', (req, res) => {
  res.json({ now: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Models directory: ${MODELS_DIR}`);
  console.log(`Drop .stl files into ${MODELS_DIR} to display them on the site.`);
});
