import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors());

// Persistence file path: stores entries keyed by IP inside servers[]
const DATA_FILE = path.join(__dirname, 'public', 'data_backup', 'edb_os_versions_backup.json');

function readDataFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { type: 'os_edb_backup', servers: [] };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    if (!raw.trim()) {
      return { type: 'os_edb_backup', servers: [] };
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { type: 'os_edb_backup', servers: parsed };
    if (!parsed || typeof parsed !== 'object') return { type: 'os_edb_backup', servers: [] };
    const servers = Array.isArray(parsed.servers) ? parsed.servers : [];
    return { type: parsed.type || 'os_edb_backup', servers };
  } catch (err) {
    console.error('Failed to read data file:', err);
    return { type: 'os_edb_backup', servers: [] };
  }
}

function writeDataFile(dataObj) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const payload = {
      type: dataObj.type || 'os_edb_backup',
      servers: Array.isArray(dataObj.servers) ? dataObj.servers : [],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write data file:', err);
    return false;
  }
}

// GET: returns a map keyed by IP with seven fields
app.get('/api/edb-os-versions', (req, res) => {
  const data = readDataFile();
  const map = {};
  for (const s of data.servers) {
    if (!s || !s.ip) continue;
    map[s.ip] = {
      release_date: s.release_date ?? '',
      last_applied_date: s.last_applied_date ?? '',
      next_update: s.next_update ?? '',
      skip: s.skip ?? '',
      reason_for_skip: s.reason_for_skip ?? '',
      upgrade_history: s.upgrade_history ?? '',
      upgrade_notes: s.upgrade_notes ?? '',
    };
  }
  res.json(map);
});

// POST: upsert one or many entries by IP
// Body:
// { ip, values: { release_date, last_applied_date, next_update, skip, reason_for_skip, upgrade_history, upgrade_notes } }
// OR { batch: [{ ip, values }, ...] }
app.post('/api/edb-os-versions', (req, res) => {
  const body = req.body || {};
  const store = readDataFile();

  const applyEntry = (entry) => {
    if (!entry || !entry.ip || !entry.values || typeof entry.values !== 'object') return;
    const ip = entry.ip;
    const allowed = [
      'release_date',
      'last_applied_date',
      'next_update',
      'skip',
      'reason_for_skip',
      'upgrade_history',
      'upgrade_notes',
    ];
    const updates = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(entry.values, k)) {
        updates[k] = entry.values[k];
      }
    }
    const idx = store.servers.findIndex(s => s && s.ip === ip);
    if (idx >= 0) {
      store.servers[idx] = { ...store.servers[idx], ...updates, ip };
    } else {
      store.servers.push({ ip, ...updates });
    }
  };

  if (Array.isArray(body.batch)) body.batch.forEach(applyEntry);
  else applyEntry(body);

  if (!writeDataFile(store)) {
    return res.status(500).json({ ok: false, error: 'Failed to persist data' });
  }
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`EDB/OS versions persistence server running on http://localhost:${PORT}`);
});

