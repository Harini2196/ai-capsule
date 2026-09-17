require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const capsuleRoutes = require('./routes/capsules');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');
app.use(express.json());
app.use(cookieParser());

// --- Public health check (required, must stay public) ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- OAuth routes: GET /login, GET /auth/github/callback, POST /logout, GET /api/me ---
app.use('/', authRoutes);

// --- Protected capsule CRUD API ---
app.use('/api/capsules', capsuleRoutes);

// --- Example of a directly-protected route pattern (kept for clarity/testing) ---
app.get('/api/protected-ping', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// --- Serve the built React frontend (same origin as the API) ---
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// Client-side routing fallback: send index.html for any non-API GET request.
app.get(/^(?!\/api\/|\/login|\/auth\/|\/logout).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AI Capsule server listening on port ${PORT}`);
  console.log(`APP_BASE_URL = ${process.env.APP_BASE_URL}`);
});
