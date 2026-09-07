export default function CapsuleList({ capsules, onEdit, onDelete }) {
  if (!capsules.length) {
    return <p className="empty-state">No prompt records yet. Create your first one above.</p>;
  }

  return (
    <div className="capsule-list">
      {capsules.map((c) => (
        <div className="capsule-card" key={c.id}>
          <div className="capsule-card-header">
            <h3>{c.prompt_title}</h3>
            <span className="badge">{c.prompt_version || 'v?'}</span>
          </div>
          <p className="capsule-meta">
            {c.project_name} {c.category ? `· ${c.category}` : ''}{' '}
            {c.usefulness ? `· ${c.usefulness}` : ''}
          </p>
          <p className="capsule-text">{c.prompt_text}</p>
          {c.response_summary && (
            <p className="capsule-summary">
              <strong>Response:</strong> {c.response_summary}
            </p>
          )}
          <p className="capsule-flags">
            {c.reviewed ? '✅ Reviewed' : '⬜ Not reviewed'} &nbsp;
            {c.improved ? '✅ Improved' : '⬜ Not improved'}
          </p>
          {c.notes && <p className="capsule-notes">{c.notes}</p>}
          <div className="capsule-card-actions">
            <button className="btn" onClick={() => onEdit(c)}>Edit</button>
            <button className="btn btn-danger" onClick={() => onDelete(c)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
