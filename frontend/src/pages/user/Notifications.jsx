import { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { notifService } from '../../services/apiServices';
import { fmtRelative, getApiError } from '../../utils/helpers';
import { LoadingState, EmptyState, Alert } from '../../components/common';

const TYPE_ICON = { transaction: '💳', budget: '📊', security: '🔒', account: '👤', financing: '🏦', system: 'ℹ️' };

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    notifService.list({ limit: 50 })
      .then(r => { setNotifs(r.data.data.notifications); setUnread(r.data.data.unreadCount); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try { await notifService.markRead(id); load(); }
    catch { }
  };

  const markAllRead = async () => {
    try { await notifService.markAllRead(); load(); }
    catch (err) { setMsg(getApiError(err)); }
  };

  return (
    <AppLayout title="Notifications">
      <div className="page-header fade-in-up">
        <div>
          <h2>Notifications {unread > 0 && <span className="badge badge-danger ml-8">{unread} new</span>}</h2>
          <p className="page-subtitle">Your alerts and account activity</p>
        </div>
        {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={markAllRead}>✓ Mark all read</button>}
      </div>

      {msg && <Alert type="error" onDismiss={() => setMsg('')}>{msg}</Alert>}

      {loading ? <LoadingState /> : !notifs.length ? (
        <div className="card"><EmptyState icon="🔔" title="No notifications" text="You're all caught up! Nothing new to see." /></div>
      ) : (
        <div className="card fade-in-up-1">
          {notifs.map((n, i) => (
            <div key={n._id}
              onClick={() => !n.readStatus && markRead(n._id)}
              style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none', cursor: n.readStatus ? 'default' : 'pointer', opacity: n.readStatus ? 0.7 : 1, transition: 'opacity 0.15s' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: n.readStatus ? 'var(--bg-elevated)' : 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                {TYPE_ICON[n.type] || 'ℹ️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex-between">
                  <span style={{ fontSize: '0.88rem', fontWeight: n.readStatus ? 500 : 700, color: n.readStatus ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{n.title}</span>
                  <span className="text-xs text-muted" style={{ flexShrink: 0, marginLeft: 12 }}>{fmtRelative(n.createdAt)}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>{n.message}</div>
                {!n.readStatus && <div style={{ width: 6, height: 6, background: 'var(--primary-light)', borderRadius: '50%', marginTop: 6 }} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
