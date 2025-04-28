import { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { userService, authService } from '../../services/apiServices';
import { useAuth } from '../../context/AuthContext';
import { fmtDate, getApiError, getInitials } from '../../utils/helpers';
import { Alert, LoadingButton, StatusBadge } from '../../components/common';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', businessName: user?.businessName || '', businessType: user?.businessType || 'kirana', businessAddress: user?.businessAddress || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const saveProfile = async () => {
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      await userService.updateProfile(form);
      await refreshUser();
      setEditing(false);
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) { setMsg({ type: 'error', text: getApiError(err) }); }
    finally { setLoading(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { setMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    if (pwForm.newPassword.length < 6) { setMsg({ type: 'error', text: 'New password must be at least 6 characters.' }); return; }
    setPwLoading(true); setMsg({ type: '', text: '' });
    try {
      await authService.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) { setMsg({ type: 'error', text: getApiError(err) }); }
    finally { setPwLoading(false); }
  };

  return (
    <AppLayout title="Profile">
      <div className="page-header fade-in-up">
        <div><h2>My Profile</h2><p className="page-subtitle">Manage your account information</p></div>
      </div>

      {msg.text && <Alert type={msg.type} onDismiss={() => setMsg({ type: '', text: '' })}>{msg.text}</Alert>}

      <div className="grid grid-2">
        {/* Profile card */}
        <div className="card fade-in-up-1">
          <div className="flex gap-16 items-center mb-20">
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.3rem', color: 'white', flexShrink: 0 }}>
              {getInitials(user?.name)}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user?.name}</div>
              <div className="text-muted text-small">{user?.email}</div>
              <div className="flex gap-8 mt-4">
                <StatusBadge status={user?.status} />
                <span className="badge badge-primary">{user?.role}</span>
              </div>
            </div>
          </div>

          {!editing ? (
            <>
              <div className="murabaha-breakdown">
  {[
    ['Full Name', user?.name],
    ['Email', user?.email],
    ['Phone', user?.phone || '—'],
    ['Business', user?.businessName || '—'],
    ['Business Type', user?.businessType],
    ['Address', user?.businessAddress || '—'],
    ['KYC Status', <StatusBadge status={user?.kycStatus} />],
    ['Joined', fmtDate(user?.createdAt)],
    ['Last Login', fmtDate(user?.lastLogin)],
  ].map(([l, v]) => (
    <div key={l} className="murabaha-row">
      <span className="murabaha-row-label">
        {l}:&nbsp;&nbsp;
      </span>

      <span
        style={{
          fontSize: '0.86rem',
          fontWeight: 500,
          textAlign: 'right',
        }}
      >
        {v}
      </span>
    </div>
  ))}
</div>
              <button className="btn btn-secondary btn-full mt-16" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
            </>
          ) : (
            <>
              {[['name','Full Name','text'],['phone','Phone','text'],['businessName','Business Name','text'],['businessAddress','Business Address','text']].map(([n, l, t]) => (
                <div key={n} className="form-group">
                  <label className="form-label">{l}</label>
                  <input name={n} type={t} className="form-input" value={form[n]} onChange={handle} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Business Type</label>
                <select name="businessType" className="form-input form-select" value={form.businessType} onChange={handle}>
                  {['kirana','general','mini_mart','departmental','other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-12">
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
                <LoadingButton loading={loading} className="btn-primary" style={{ flex: 2 }} onClick={saveProfile}>Save Changes</LoadingButton>
              </div>
            </>
          )}
        </div>

        {/* Security & credit */}
        <div className="flex-col gap-20">
          {/* Credit info */}
          <div className="card fade-in-up-2">
            <div className="card-title mb-16">💰 Credit Information</div>
            <div className="murabaha-breakdown">
  <div className="murabaha-row">
    <span className="murabaha-row-label">
      Total Credit Limit:&nbsp;&nbsp;
    </span>

    <span className="money murabaha-row-value">
      {user?.totalCreditLimit?.toLocaleString() || 0} PKR
    </span>
  </div>

  <div className="murabaha-row total">
    <span className="murabaha-row-label">
      Available Credit:&nbsp;&nbsp;
    </span>

    <span className="money murabaha-row-value">
      {user?.availableCredit?.toLocaleString() || 0} PKR
    </span>
  </div>

  <div className="murabaha-row">
    <span className="murabaha-row-label">
      Risk Tier:&nbsp;&nbsp;
    </span>

    <span className="murabaha-row-value">
      <span className="badge badge-info">
        {user?.riskTier}
      </span>
    </span>
  </div>
</div>
          </div>

          {/* Change password */}
          <div className="card fade-in-up-3">
            <div className="card-title mb-16">🔒 Change Password</div>
            <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-input" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-input" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Confirm New Password</label><input type="password" className="form-input" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} /></div>
            <LoadingButton loading={pwLoading} className="btn-secondary btn-full" onClick={changePassword}>Update Password</LoadingButton>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
