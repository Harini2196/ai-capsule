const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Fail loudly at startup rather than silently signing with "undefined".
  console.warn(
    '[auth] WARNING: JWT_SECRET is not set. Set it in your environment (.env) before deploying.'
  );
}

/**
 * Signs an application JWT for a logged-in user.
 * The payload only ever contains identifiers obtained from the verified
 * OAuth provider response - never anything supplied by the client.
 */
function signAppToken(user) {
  return jwt.sign(
    {
      sub: user.id,          // provider user id (e.g. GitHub numeric id)
      username: user.username,
      provider: user.provider,
    },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

/**
 * Express middleware that verifies the JWT stored in the httpOnly "token"
 * cookie. On success it attaches req.user = { id, username, provider }.
 * On failure it returns 401 and never leaks protected data.
 */
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: no token provided' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: String(payload.sub),
      username: payload.username,
      provider: payload.provider,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}

module.exports = { signAppToken, requireAuth, JWT_SECRET };
