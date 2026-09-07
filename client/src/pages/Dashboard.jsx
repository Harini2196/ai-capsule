import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import CapsuleForm from '../components/CapsuleForm';
import CapsuleList from '../components/CapsuleList';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [editing, setEditing] = useState(null); // capsule being edited, or null
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setUser(me);
        const list = await api.listCapsules();
        setCapsules(list);
      } catch (err) {
        if (err.status === 401) {
          navigate('/');
          return;
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function refresh() {
    const list = await api.listCapsules();
    setCapsules(list);
  }

  async function handleCreate(form) {
    await api.createCapsule(form);
    setShowForm(false);
    await refresh();
  }

  async function handleUpdate(form) {
    await api.updateCapsule(editing.id, form);
    setEditing(null);
    await refresh();
  }

  async function handleDelete(capsule) {
    if (!window.confirm(`Delete "${capsule.prompt_title}"?`)) return;
    await api.deleteCapsule(capsule.id);
    await refresh();
  }

  async function handleLogout() {
    await api.logout();
    navigate('/');
  }

  if (loading) return <div className="page">Loading...</div>;

  return (
    <div className="page dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          {user && <p className="tagline">Signed in as {user.username}</p>}
        </div>
        <button className="btn" onClick={handleLogout}>Logout</button>
      </div>

      {error && <p className="error">{error}</p>}

      {editing ? (
        <>
          <h2>Edit record</h2>
          <CapsuleForm
            initial={editing}
            submitLabel="Update"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </>
      ) : showForm ? (
        <>
          <h2>New record</h2>
          <CapsuleForm submitLabel="Create" onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </>
      ) : (
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + New prompt record
        </button>
      )}

      <h2>Your records ({capsules.length})</h2>
      <CapsuleList capsules={capsules} onEdit={setEditing} onDelete={handleDelete} />
    </div>
  );
}
