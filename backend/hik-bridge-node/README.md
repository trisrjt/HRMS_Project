Hikvision Bridge (Node) - Minimal

This is a tiny Node/Express scaffold to simulate a Hikvision device webhook and event store for local testing.

Install & run:

```bash
cd backend/hik-bridge-node
npm install
npm start
```

Endpoints:
- `POST /webhook` — receive device event JSON
- `GET  /events` — list recent events
- `POST /mock-generate` — create a simulated event (body: user_id, method, snapshot_url)

This is optional; the Laravel backend already provides similar endpoints. Use this if you prefer a lightweight Node mock.
