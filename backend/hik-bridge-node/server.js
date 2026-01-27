const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

const DATA_FILE = path.join(__dirname, 'events.json');

async function readEvents() {
  try { return await fs.readJson(DATA_FILE); } catch (e) { return []; }
}
async function writeEvents(arr) { await fs.writeJson(DATA_FILE, arr, { spaces: 2 }); }

app.get('/events', async (req, res) => {
  const events = await readEvents();
  res.json({ data: events });
});

app.post('/webhook', async (req, res) => {
  const payload = req.body || {};
  const events = await readEvents();
  const ev = Object.assign({ id: 'ev_' + Date.now(), received_at: new Date().toISOString() }, payload);
  events.unshift(ev);
  await writeEvents(events.slice(0, 500));
  res.json({ status: 'ok', event: ev });
});

app.post('/mock-generate', async (req, res) => {
  const body = req.body || {};
  const ev = {
    id: 'ev_' + Date.now(),
    device_id: 'node_sim_1',
    device_type: 'Hikvision Node Bridge',
    user_id: body.user_id || ('u_' + Math.floor(Math.random() * 900 + 100)),
    method: body.method || 'face',
    snapshot_url: body.snapshot_url || null,
    timestamp: new Date().toISOString(),
  };
  const events = await readEvents();
  events.unshift(ev);
  await writeEvents(events.slice(0, 500));
  res.json({ data: ev });
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => console.log('Hik Bridge Node listening on', PORT));
