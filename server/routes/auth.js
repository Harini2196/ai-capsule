const express = require('express');
const fetch = require('node-fetch');
const { signAppToken } = require('../middleware/auth');

const router = express.Router();

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  NODE_ENV,
} = process.env;

// Trim any trailing slash so we never accidentally build a redirect_uri
// with a double slash (e.g. APP_BASE_URL="https://x.onrender.com/" would
// otherwise produce ".../ /auth/github/callback" and GitHub would reject
// it as "not associated with this application").
const APP_BASE_URL = (process.env.APP_BASE_URL || '').replace(/\/+$/, '');

const CALLBACK_PATH = '/auth/github/callback';

function getRedirectUri() {
  return `${APP_BASE_URL}${CALLBACK_PATH}`;
}

// GET /login - starts the GitHub OAuth flow (public)
router.get('/login', (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res
      .status(500)
      .send('Server misconfiguration: GITHUB_CLIENT_ID is not set.');
  }
  if (!APP_BASE_URL) {
    return res
      .status(500)
      .send('Server misconfiguration: APP_BASE_URL is not set.');
  }

  const redirectUri = getRedirectUri();

  // Logged so you can compare this EXACT string, character for character,
  // against the "Authorization callback URL" registered on your GitHub
  // OAuth App. Any difference (http vs https, trailing slash, wrong host)
  // causes GitHub's "redirect_uri is not associated with this application"
  // error.
  console.log(`[oauth] /login -> redirect_uri = ${redirectUri}`);

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read:user',
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// GET /auth/github/callback - GitHub redirects here with ?code=...
router.get(CALLBACK_PATH, async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing OAuth code from GitHub.');
  }

  try {
    // 1. Exchange the code for a GitHub access token
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: getRedirectUri(),
      }),
    });
    const tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      console.error('GitHub token exchange failed:', tokenData);
      return res.status(401).send('GitHub OAuth failed: could not obtain access token.');
    }

    // 2. Use the GitHub access token to fetch the user's profile
    const profileResp = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'ai-capsule-app',
      },
    });
    const profile = await profileResp.json();

    if (!profile || !profile.id) {
      console.error('GitHub profile fetch failed:', profile);
      return res.status(401).send('GitHub OAuth failed: could not fetch profile.');
    }

    // 3. Issue OUR OWN application JWT (never forward GitHub's token to the client)
    const appToken = signAppToken({
      id: profile.id,
      username: profile.login,
      provider: 'github',
    });

    // 4. Store it in a Secure, HttpOnly cookie named "token"
    res.cookie('token', appToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.status(500).send('Internal error during OAuth callback.');
  }
});

// POST /logout - clears the session cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// GET /api/me - lets the frontend check whether it has a valid session
router.get('/api/me', (req, res) => {
  const jwt = require('jsonwebtoken');
  const token = req.cookies && req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ id: String(payload.sub), username: payload.username, provider: payload.provider });
  } catch {
    return res.status(401).json({ error: 'Not authenticated' });
  }
});

module.exports = router;
