import { useEffect, useState } from 'react';

const EMPTY = {
  project_name: '',
  prompt_title: '',
  prompt_version: '',
  prompt_text: '',
  response_summary: '',
  category: '',
  usefulness: '',
  reviewed: false,
  improved: false,
  screenshot_url: '',
  notes: '',
};

export default function CapsuleForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
  }, [initial]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="capsule-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Project name *
          <input
            required
            value={form.project_name}
            onChange={(e) => update('project_name', e.target.value)}
          />
        </label>
        <label>
          Prompt title *
          <input
            required
            value={form.prompt_title}
            onChange={(e) => update('prompt_title', e.target.value)}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Version
          <input
            placeholder="v1"
            value={form.prompt_version}
            onChange={(e) => update('prompt_version', e.target.value)}
          />
        </label>
        <label>
          Category
          <input
            placeholder="Coding / Writing / Research"
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
          />
        </label>
      </div>

      <label>
        Prompt text *
        <textarea
          required
          rows={3}
          value={form.prompt_text}
          onChange={(e) => update('prompt_text', e.target.value)}
        />
      </label>

      <label>
        Response summary
        <textarea
          rows={2}
          value={form.response_summary}
          onChange={(e) => update('response_summary', e.target.value)}
        />
      </label>

      <div className="form-row">
        <label>
          Usefulness
          <select value={form.usefulness} onChange={(e) => update('usefulness', e.target.value)}>
            <option value="">--</option>
            <option value="Good">Good</option>
            <option value="Needs Improvement">Needs Improvement</option>
          </select>
        </label>
        <label>
          Screenshot URL
          <input
            placeholder="https://..."
            value={form.screenshot_url}
            onChange={(e) => update('screenshot_url', e.target.value)}
          />
        </label>
      </div>

      <div className="form-row checkboxes">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={!!form.reviewed}
            onChange={(e) => update('reviewed', e.target.checked)}
          />
          Reviewed
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={!!form.improved}
            onChange={(e) => update('improved', e.target.checked)}
          />
          Improved
        </label>
      </div>

      <label>
        Notes
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
        />
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel || 'Save'}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
