const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All routes below require a valid JWT
router.use(requireAuth);

// GET /api/capsules - list only the authenticated user's records
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(rows);
});

// POST /api/capsules - create a record owned by the authenticated user
router.post('/', (req, res) => {
  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: 'project_name, prompt_title and prompt_text are required',
    });
  }

  const stmt = db.prepare(`
    INSERT INTO capsules
      (user_id, project_name, prompt_title, prompt_version, prompt_text,
       response_summary, category, usefulness, reviewed, improved,
       screenshot_url, notes)
    VALUES (@user_id, @project_name, @prompt_title, @prompt_version, @prompt_text,
            @response_summary, @category, @usefulness, @reviewed, @improved,
            @screenshot_url, @notes)
  `);

  const info = stmt.run({
    user_id: req.user.id, // from the verified JWT, never from the client
    project_name,
    prompt_title,
    prompt_version: prompt_version || null,
    prompt_text,
    response_summary: response_summary || null,
    category: category || null,
    usefulness: usefulness || null,
    reviewed: reviewed ? 1 : 0,
    improved: improved ? 1 : 0,
    screenshot_url: screenshot_url || null,
    notes: notes || null,
  });

  const created = db.prepare('SELECT * FROM capsules WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// Helper: fetch a capsule and confirm the current user owns it
function findOwnedCapsule(id, userId) {
  return db.prepare('SELECT * FROM capsules WHERE id = ? AND user_id = ?').get(id, userId);
}

// PUT /api/capsules/:id - update a record owned by the authenticated user
router.put('/:id', (req, res) => {
  const existing = findOwnedCapsule(req.params.id, req.user.id);
  if (!existing) {
    // Either it doesn't exist, or it belongs to someone else - don't leak which.
    return res.status(404).json({ error: 'Capsule not found' });
  }

  const merged = { ...existing, ...req.body };

  db.prepare(`
    UPDATE capsules SET
      project_name = @project_name,
      prompt_title = @prompt_title,
      prompt_version = @prompt_version,
      prompt_text = @prompt_text,
      response_summary = @response_summary,
      category = @category,
      usefulness = @usefulness,
      reviewed = @reviewed,
      improved = @improved,
      screenshot_url = @screenshot_url,
      notes = @notes
    WHERE id = @id AND user_id = @user_id
  `).run({
    id: existing.id,
    user_id: req.user.id,
    project_name: merged.project_name,
    prompt_title: merged.prompt_title,
    prompt_version: merged.prompt_version || null,
    prompt_text: merged.prompt_text,
    response_summary: merged.response_summary || null,
    category: merged.category || null,
    usefulness: merged.usefulness || null,
    reviewed: merged.reviewed ? 1 : 0,
    improved: merged.improved ? 1 : 0,
    screenshot_url: merged.screenshot_url || null,
    notes: merged.notes || null,
  });

  const updated = db.prepare('SELECT * FROM capsules WHERE id = ?').get(existing.id);
  res.json(updated);
});

// DELETE /api/capsules/:id - delete a record owned by the authenticated user
router.delete('/:id', (req, res) => {
  const existing = findOwnedCapsule(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Capsule not found' });
  }

  db.prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?').run(existing.id, req.user.id);
  res.status(204).send();
});

module.exports = router;
