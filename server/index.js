const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { URL } = require('url');
const { imgproxyUrl, transformImages, IMGPROXY_BASE } = require('./lib/imgproxy');

const app = express();
const PORT = process.env.PORT || 3001;
const MODELS_DIR = path.join(__dirname, 'public', 'models');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'admin-config.json');
const PROJECTS_PATH = path.join(DATA_DIR, 'printables-projects.json');
const CUSTOM_PROJECTS_PATH = path.join(DATA_DIR, 'custom-projects.json');

// Ensure directories exist
[MODELS_DIR, UPLOADS_DIR, DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer config for image uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : true,
}));
app.use(express.json());

// Serve static files (originals still available as fallback)
app.use('/models', express.static(MODELS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// ── imgproxy proxy ──
// Proxies /api/img/* requests to the imgproxy service
app.use('/api/img', (req, res) => {
  // Pass the full path after /api/img to imgproxy
  const imgproxyPath = req.url;
  const targetUrl = new URL(imgproxyPath, IMGPROXY_BASE);

  http.get(targetUrl.href, (proxyRes) => {
    const headers = {
      'content-type': proxyRes.headers['content-type'] || 'image/jpeg',
      // Browser cache: 1 year (immutable processed images)
      'cache-control': 'public, max-age=31536000, immutable',
      // Cloudflare edge cache: 1 year
      'cdn-cache-control': 'public, max-age=31536000',
      // Cloudflare-specific override (takes priority over cdn-cache-control)
      'cloudflare-cdn-cache-control': 'public, max-age=31536000',
      // Vary on Accept for WebP/AVIF negotiation
      'vary': 'Accept',
    };
    if (proxyRes.headers['content-length']) {
      headers['content-length'] = proxyRes.headers['content-length'];
    }
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  }).on('error', (err) => {
    console.error('[imgproxy] Proxy error:', err.message);
    res.status(502).json({ error: 'Image proxy unavailable' });
  });
});

// ── Helpers ──

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return { blacklist: [], selectedStls: {} };
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function loadProjects() {
  if (!fs.existsSync(PROJECTS_PATH)) return [];
  return JSON.parse(fs.readFileSync(PROJECTS_PATH, 'utf8'));
}

function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_PATH, JSON.stringify(projects, null, 2));
}

function loadCustomProjects() {
  if (!fs.existsSync(CUSTOM_PROJECTS_PATH)) return [];
  return JSON.parse(fs.readFileSync(CUSTOM_PROJECTS_PATH, 'utf8'));
}

function saveCustomProjects(projects) {
  fs.writeFileSync(CUSTOM_PROJECTS_PATH, JSON.stringify(projects, null, 2));
}

// ── Public API ──

// List models for the frontend (respects blacklist, includes printables + custom projects)
app.get('/api/models', (req, res) => {
  const config = loadConfig();
  const projects = loadProjects();

  const printablesVisible = projects
    .filter(p => !config.blacklist.includes(p.id))
    .filter(p => config.selectedStls[p.id])
    .map(p => {
      const selected = config.selectedStls[p.id];
      const stlFilename = selected.localFilename;
      const stlPath = path.join(MODELS_DIR, stlFilename);
      const exists = fs.existsSync(stlPath);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        summary: p.summary,
        description: p.description,
        url: p.url,
        images: transformImages(p.images, 'card'),
        tags: p.tags,
        category: p.category,
        likesCount: p.likesCount,
        downloadCount: p.downloadCount,
        stlUrl: exists ? `/models/${encodeURIComponent(stlFilename)}` : null,
        stlName: selected.originalName,
        type: 'printables',
      };
    })
    .filter(p => p.stlUrl);

  // Include custom projects
  const customVisible = loadCustomProjects().map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    summary: p.summary,
    description: p.description,
    url: null,
    images: transformImages(p.images, 'card'),
    tags: p.tags || [],
    category: p.category || 'Custom',
    coverImage: p.coverImage ? imgproxyUrl(p.coverImage, 'card') : null,
    coverImageOriginal: p.coverImage,
    stlUrl: null,
    stlName: null,
    type: 'custom',
  }));

  res.json([...printablesVisible, ...customVisible]);
});

// Single model detail
app.get('/api/models/:id', (req, res) => {
  const config = loadConfig();

  // Check custom projects first
  const customProjects = loadCustomProjects();
  const custom = customProjects.find(proj => proj.id === req.params.id);
  if (custom) {
    return res.json({
      id: custom.id,
      name: custom.name,
      slug: custom.slug,
      summary: custom.summary,
      description: custom.description,
      url: null,
      images: transformImages(custom.images, 'gallery'),
      tags: custom.tags || [],
      category: custom.category || 'Custom',
      coverImage: custom.coverImage ? imgproxyUrl(custom.coverImage, 'cover') : null,
      coverImageOriginal: custom.coverImage,
      datePublished: custom.createdAt,
      stlUrl: null,
      stlName: null,
      type: 'custom',
    });
  }

  // Check printables projects
  const projects = loadProjects();
  const p = projects.find(proj => proj.id === req.params.id);
  if (!p || config.blacklist.includes(p.id)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const selected = config.selectedStls[p.id];
  let stlUrl = null;
  if (selected) {
    const stlPath = path.join(MODELS_DIR, selected.localFilename);
    if (fs.existsSync(stlPath)) {
      stlUrl = `/models/${encodeURIComponent(selected.localFilename)}`;
    }
  }

  res.json({
    id: p.id,
    name: p.name,
    slug: p.slug,
    summary: p.summary,
    description: p.description,
    url: p.url,
    images: transformImages(p.images, 'gallery'),
    tags: p.tags,
    category: p.category,
    likesCount: p.likesCount,
    downloadCount: p.downloadCount,
    datePublished: p.datePublished,
    stlUrl,
    stlName: selected?.originalName || null,
    type: 'printables',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Admin API ──

// Track fetch status
let fetchStatus = { running: false, progress: '', error: null };

// Track STL download status per project
let downloadStatus = {};

// Get all projects with admin state (blacklist, selected STL)
app.get('/api/admin/projects', (req, res) => {
  const config = loadConfig();
  const projects = loadProjects();

  const enriched = projects.map(p => ({
    ...p,
    blacklisted: config.blacklist.includes(p.id),
    selectedStl: config.selectedStls[p.id] || null,
    stlDownloaded: config.selectedStls[p.id]
      ? fs.existsSync(path.join(MODELS_DIR, config.selectedStls[p.id].localFilename))
      : false,
  }));

  res.json(enriched);
});

// Get fetch status
app.get('/api/admin/fetch-status', (req, res) => {
  res.json(fetchStatus);
});

// Trigger Printables fetch
app.post('/api/admin/fetch-printables', async (req, res) => {
  if (fetchStatus.running) {
    return res.status(409).json({ error: 'Fetch already in progress' });
  }

  const handle = req.body.handle || 'Aerocreative';
  fetchStatus = { running: true, progress: 'Starting browser...', error: null };
  res.json({ started: true });

  // Run async — don't block the response
  (async () => {
    try {
      const { fetchPrintablesProjects } = require('./lib/printables');
      const projects = await fetchPrintablesProjects(handle, (msg) => {
        fetchStatus.progress = msg;
      });
      saveProjects(projects);
      fetchStatus = { running: false, progress: `Done! Found ${projects.length} projects.`, error: null };
    } catch (err) {
      fetchStatus = { running: false, progress: '', error: err.message };
    }
  })();
});

// Toggle blacklist for a project
app.post('/api/admin/projects/:id/blacklist', (req, res) => {
  const config = loadConfig();
  const { id } = req.params;
  const { blacklisted } = req.body;

  if (blacklisted) {
    if (!config.blacklist.includes(id)) config.blacklist.push(id);
  } else {
    config.blacklist = config.blacklist.filter(x => x !== id);
  }

  saveConfig(config);
  res.json({ id, blacklisted: config.blacklist.includes(id) });
});

// Get STL download status
app.get('/api/admin/download-status/:id', (req, res) => {
  const { id } = req.params;
  res.json(downloadStatus[id] || { status: 'idle' });
});

// Select display STL for a project and download it (async — responds immediately)
app.post('/api/admin/projects/:id/select-stl', (req, res) => {
  const { id } = req.params;
  const { stlFileId, stlFileName } = req.body;
  console.log(`[STL] POST /select-stl called: id=${id}, stlFileId=${stlFileId}, stlFileName=${stlFileName}`);

  if (!stlFileId || !stlFileName) {
    console.log('[STL] Rejected: missing stlFileId or stlFileName');
    return res.status(400).json({ error: 'stlFileId and stlFileName are required' });
  }

  const config = loadConfig();
  const projects = loadProjects();
  const project = projects.find(p => p.id === id);
  if (!project) {
    console.log(`[STL] Rejected: project ${id} not found. Available IDs: ${projects.slice(0, 5).map(p => p.id).join(', ')}...`);
    return res.status(404).json({ error: 'Project not found' });
  }

  // Sanitize filename
  const safeName = `${id}-${stlFileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const localFilename = safeName.endsWith('.stl') || safeName.endsWith('.3mf') ? safeName : `${safeName}.stl`;
  const outputPath = path.join(MODELS_DIR, localFilename);

  // Save selection immediately
  config.selectedStls[id] = {
    stlFileId,
    originalName: stlFileName,
    localFilename,
    downloadedAt: null,
  };
  saveConfig(config);

  // Respond immediately
  downloadStatus[id] = { status: 'downloading', progress: 'Starting browser...' };
  res.json({ started: true, localFilename });

  // Download in background
  (async () => {
    try {
      const { downloadSTLFile } = require('./lib/printables');
      console.log(`[STL Download] Starting download for project ${id}, file ${stlFileId}`);
      downloadStatus[id] = { status: 'downloading', progress: 'Fetching download link...' };
      const result = await downloadSTLFile(stlFileId, id, outputPath);
      const freshConfig = loadConfig();
      freshConfig.selectedStls[id].downloadedAt = new Date().toISOString();
      freshConfig.selectedStls[id].fileSize = result.size;
      saveConfig(freshConfig);
      downloadStatus[id] = { status: 'done', size: result.size };
      console.log(`[STL Download] Success for project ${id}: ${result.size} bytes`);
    } catch (err) {
      console.error(`[STL Download] Failed for project ${id}:`, err.message);
      downloadStatus[id] = { status: 'error', error: err.message };
    }
  })();
});

// Clear selection for a project
app.delete('/api/admin/projects/:id/select-stl', (req, res) => {
  const config = loadConfig();
  const { id } = req.params;

  if (config.selectedStls[id]) {
    // Remove the downloaded file
    const filePath = path.join(MODELS_DIR, config.selectedStls[id].localFilename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    delete config.selectedStls[id];
    saveConfig(config);
  }

  res.json({ success: true });
});

// Reset a single project (clear blacklist, STL selection, delete downloaded file)
app.post('/api/admin/projects/:id/reset', (req, res) => {
  const config = loadConfig();
  const { id } = req.params;

  // Remove from blacklist
  config.blacklist = config.blacklist.filter(x => x !== id);

  // Delete downloaded STL file
  if (config.selectedStls[id]) {
    const filePath = path.join(MODELS_DIR, config.selectedStls[id].localFilename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    delete config.selectedStls[id];
  }

  // Clear download status
  delete downloadStatus[id];

  saveConfig(config);
  res.json({ success: true });
});

// Reset everything (clear all config, delete all downloaded STLs, clear projects)
app.post('/api/admin/reset-all', (req, res) => {
  const config = loadConfig();

  // Delete all downloaded STL files
  for (const id of Object.keys(config.selectedStls)) {
    const filePath = path.join(MODELS_DIR, config.selectedStls[id].localFilename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  // Reset config
  saveConfig({ blacklist: [], selectedStls: {} });

  // Clear projects data
  saveProjects([]);

  // Clear in-memory state
  downloadStatus = {};
  fetchStatus = { running: false, progress: '', error: null };

  res.json({ success: true });
});

// ── Custom Projects Admin API ──

// List custom projects
app.get('/api/admin/custom-projects', (req, res) => {
  res.json(loadCustomProjects());
});

// Create custom project
app.post('/api/admin/custom-projects', (req, res) => {
  const { name, summary, description, category, tags } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const projects = loadCustomProjects();
  const id = `custom-${Date.now()}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const project = {
    id,
    name,
    slug,
    summary: summary || '',
    description: description || '',
    category: category || 'Custom',
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    coverImage: null,
    images: [],
    createdAt: new Date().toISOString(),
  };

  projects.push(project);
  saveCustomProjects(projects);
  res.json(project);
});

// Update custom project
app.put('/api/admin/custom-projects/:id', (req, res) => {
  const projects = loadCustomProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const { name, summary, description, category, tags } = req.body;
  if (name) projects[idx].name = name;
  if (summary !== undefined) projects[idx].summary = summary;
  if (description !== undefined) projects[idx].description = description;
  if (category !== undefined) projects[idx].category = category;
  if (tags !== undefined) {
    projects[idx].tags = typeof tags === 'string'
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : tags;
  }

  saveCustomProjects(projects);
  res.json(projects[idx]);
});

// Delete custom project (and its uploaded files)
app.delete('/api/admin/custom-projects/:id', (req, res) => {
  const projects = loadCustomProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  // Delete uploaded images
  if (project.coverImage) {
    const coverPath = path.join(__dirname, 'public', project.coverImage);
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
  }
  for (const img of (project.images || [])) {
    const imgPath = path.join(__dirname, 'public', img.url);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  const filtered = projects.filter(p => p.id !== req.params.id);
  saveCustomProjects(filtered);
  res.json({ success: true });
});

// Upload cover image for a custom project
app.post('/api/admin/custom-projects/:id/cover', upload.single('cover'), (req, res) => {
  const projects = loadCustomProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  // Delete old cover if exists
  if (project.coverImage) {
    const oldPath = path.join(__dirname, 'public', project.coverImage);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  project.coverImage = `/uploads/${req.file.filename}`;
  saveCustomProjects(projects);
  res.json({ coverImage: project.coverImage });
});

// Upload gallery images for a custom project
app.post('/api/admin/custom-projects/:id/images', upload.array('images', 20), (req, res) => {
  const projects = loadCustomProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  const newImages = req.files.map(f => ({
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: `/uploads/${f.filename}`,
    originalName: f.originalname,
  }));

  project.images = [...(project.images || []), ...newImages];
  saveCustomProjects(projects);
  res.json({ images: project.images });
});

// Delete a gallery image from a custom project
app.delete('/api/admin/custom-projects/:id/images/:imageId', (req, res) => {
  const projects = loadCustomProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  const image = (project.images || []).find(img => img.id === req.params.imageId);
  if (image) {
    const imgPath = path.join(__dirname, 'public', image.url);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    project.images = project.images.filter(img => img.id !== req.params.imageId);
    saveCustomProjects(projects);
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Models directory: ${MODELS_DIR}`);
  console.log(`Admin setup: http://localhost:5173/setup (no public link)`);
});
