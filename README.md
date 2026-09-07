# AI Capsule

Cloud-Deployed AI Prompt Manager — CSE3CWA / CSE5006, Assignment 3.

A small full-stack app for saving and managing AI prompts. Users sign in
with GitHub OAuth; the Express backend issues its own application JWT
(stored in a `Secure, HttpOnly` cookie named `token`) and protects a
CRUD API so each user can only see and manage their own prompt records.

## Deployed application

- **Public URL:** _fill in after deploying, e.g. `https://ai-capsule.onrender.com`_
- **Cloud platform:** _Render (recommended) / Azure App Service / other_

## Tech stack

| Component      | Choice                                           |
|----------------|---------------------------------------------------|
| Frontend       | React 19 + Vite, React Router                     |
| Backend        | Node.js + Express                                  |
| Auth           | GitHub OAuth → application JWT (`jsonwebtoken`)    |
| Storage        | SQLite (`better-sqlite3`)                          |
| Deployment     | Single Express server serves the built React app   |

The frontend and backend are deployed together as one app on one public
URL (Express serves the built React files from `client/dist` and exposes
the API under `/api/...`), which avoids CORS / cross-origin cookie issues.

## Project structure

```
ai-capsule/
  server/
    index.js          # Express app entry point
    routes/
      auth.js          # /login, /auth/github/callback, /logout, /api/me
      capsules.js       # protected CRUD for /api/capsules
    middleware/
      auth.js           # JWT signing + requireAuth middleware
    db/
      index.js          # better-sqlite3 connection + schema
  client/               # React (Vite) frontend
    src/
      pages/Home.jsx        # public landing page (/)
      pages/Dashboard.jsx   # protected dashboard (/dashboard)
      components/           # CapsuleForm, CapsuleList
      lib/api.js             # fetch wrapper for the backend API
  .env.example
  package.json           # root/server package.json (also builds client)
```

## Required routes

| Route                     | Access    | Purpose                          |
|----------------------------|-----------|-----------------------------------|
| `GET /`                     | Public    | Landing page (React)              |
| `GET /login`                 | Public    | Starts GitHub OAuth               |
| `GET /dashboard`             | Protected | React dashboard (client-side auth check via `/api/me`) |
| `GET /api/health`            | Public    | `{ "status": "ok" }`               |
| `GET /api/capsules`          | Protected | List the authenticated user's records |
| `POST /api/capsules`         | Protected | Create a record                    |
| `PUT /api/capsules/:id`      | Protected | Update own record                  |
| `DELETE /api/capsules/:id`   | Protected | Delete own record                  |
| `GET /auth/github/callback`  | Public    | OAuth callback (GitHub redirects here) |

The frontend calls the Express API with relative URLs and
`credentials: 'include'` (see `client/src/lib/api.js`) since both are
served from the same origin in production.

## OAuth + JWT flow

1. The user clicks **Login with GitHub**, a normal `<a href="/login">`
   link (a full page navigation, not a React route) that hits the
   Express server.
2. `GET /login` redirects to GitHub's OAuth `authorize` endpoint.
3. GitHub redirects back to `GET /auth/github/callback?code=...`.
4. The server exchanges the code for a GitHub access token, fetches the
   user's GitHub profile, then **signs its own application JWT**
   (`server/middleware/auth.js`) containing the GitHub user id and
   username — never the GitHub access token itself.
5. That JWT is stored in a `Secure, HttpOnly` cookie named `token` and
   the user is redirected to `/dashboard`.
6. Every request to `/api/capsules/*` runs through `requireAuth`
   middleware, which verifies the JWT from the `token` cookie and
   attaches `req.user`. Missing/invalid tokens get `401 Unauthorized`
   with no capsule data returned.
7. `user_id` for every capsule record comes from `req.user.id` (the
   verified JWT) — it is never accepted from the request body.

## Environment variables

Copy `.env.example` to `.env` and fill in real values for local
development. **Never commit `.env` or real secrets.**

| Variable                | Purpose                                              |
|--------------------------|-------------------------------------------------------|
| `PORT`                    | Port Express listens on                                |
| `NODE_ENV`                 | `development` / `production`                          |
| `APP_BASE_URL`              | Public base URL (used to build the OAuth callback URL) |
| `JWT_SECRET`                 | Secret used to sign/verify the application JWT          |
| `GITHUB_CLIENT_ID`            | GitHub OAuth App client ID                              |
| `GITHUB_CLIENT_SECRET`         | GitHub OAuth App client secret                          |
| `DB_PATH`                        | Path to the SQLite file                                  |

## Running locally

```bash
# from the ai-capsule/ folder
npm install                 # installs server deps
npm install --prefix client # installs client deps

cp .env.example .env
# then edit .env: set JWT_SECRET, GITHUB_CLIENT_ID/SECRET,
# and APP_BASE_URL=https://ai-capsule-7qlg.onrender.com/


# Build the React app once (Express serves the built files):
npm run build

# Start the server (serves API + built frontend on :5000)
npm start
# open https://ai-capsule-7qlg.onrender.com/
```

For frontend hot-reload during development, run the API and the Vite
dev server side by side in two terminals:

```bash
npm run dev:server     # Express API on :5000
npm run dev:client     # Vite dev server on :5173 (proxies /api, /login, /auth to :5000)
```

## Deploying to Render

Render's Node build step does **not** automatically install the root
(server) dependencies when you supply a custom Build Command, so the
Build Command must install *both* the server deps and the client deps,
then build the client:

| Setting        | Value                          |
|-----------------|----------------------------------|
| Build Command    | `npm install && npm run build`     |
| Start Command     | `npm start`                          |

The root `npm run build` script (see `package.json`) then runs
`npm install --prefix client --include=dev && npm run build --prefix client`.
The `--include=dev` flag matters: Render sets `NODE_ENV=production`
during the build, and a plain `npm install` silently skips
`devDependencies` (which is where Vite lives) under `NODE_ENV=production` —
without it the build fails with `vite: not found`.

Set the environment variables listed above (`JWT_SECRET`,
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `APP_BASE_URL`, `DB_PATH`,
`NODE_ENV=production`) in Render's **Environment** tab before deploying.

**Node version:** the app pins Node to `22.x` (see `package.json`'s
`engines` field and the `.node-version` file). This matters because
`better-sqlite3` ships prebuilt native binaries for common Node
versions; on a Node version too new to have a prebuilt binary yet,
`npm install` falls back to compiling it from source with `node-gyp`,
which can fail against a newer V8 API (this is what a
`better_sqlite3.target.mk ... Error 1` / `node-gyp` build failure means).
Render reads `.node-version` to pick the Node runtime, so no extra
dashboard setting is needed — just make sure the file is committed.

## Database / storage

SQLite via `better-sqlite3`. The `capsules` table is created
automatically on first run (see `server/db/index.js`) using the exact
schema in the assignment brief. Each row is tied to `user_id`, the
GitHub user id taken from the verified JWT.

**Persistence note:** if deployed on Render's free web service, the
filesystem is ephemeral — the SQLite file (and all saved capsules) can
be reset on restart or redeploy. This is a known/accepted limitation for
the free tier; Render PostgreSQL (or Azure with a persistent disk) would
give durable storage instead.

## Required cURL checks

Run these against the **deployed** URL before submission:

```bash
# Test 1 - no authentication
curl -i https://YOUR-APP/api/capsules
# Required: 401 Unauthorized

# Test 2 - fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP/api/capsules
# Required: 401 Unauthorized
```

_Results obtained (fill in after deployment):_

```
Test 1: <paste status + body>
Test 2: <paste status + body>
```

## Known limitation

_Fill in one honest limitation, e.g.: "SQLite storage is not guaranteed
to persist across redeploys on Render's free tier" or "Only GitHub OAuth
is implemented; Google fallback was not needed."_

## AI-assisted development

- **AI tools used:** _e.g. Claude (Anthropic)_
- **Problem found & corrected in AI-generated code:** _fill in, e.g. an
  initial version accepted `user_id` from the request body instead of
  the verified JWT — fixed by deriving it from `req.user.id` in the
  `requireAuth` middleware._
- **How OAuth/JWT/CRUD/ownership were verified:** manual testing with
  cURL against a signed JWT for one simulated user, confirming a second
  user's token could not read/update/delete the first user's records
  (see PUT/DELETE returning `404` for a non-owner in the routes).
- **One implementation/deployment decision:** serving the built React
  app from the same Express server/origin as the API, to avoid CORS and
  cross-origin cookie configuration for the `token` cookie.
