import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/helpers';
import { LoadingButton, Alert } from '../../components/common';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Email and password required.'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(getApiError(err));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div className="text-center mb-24 fade-in-up">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: 14, fontSize: '1.3rem', marginBottom: 16, boxShadow: 'var(--shadow-glow)' }}>RS</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Welcome back</h2>
          <p className="text-muted text-small">Sign in to your RetailStock account</p>
        </div>

        <div className="card fade-in-up-1">
          {error && <Alert type="error" onDismiss={() => setError('')}>{error}</Alert>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input name="email" type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handle} autoComplete="email" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input name="password" type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={handle} autoComplete="current-password" />
              </div>
            </div>
            <LoadingButton loading={loading} className="btn-primary btn-full btn-lg" type="submit">
              Sign In
            </LoadingButton>
          </form>

          <div className="text-center mt-16">
            <span className="text-muted text-small">Don't have an account? </span>
            <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600, fontSize: '0.85rem' }}>Create account</Link>
          </div>
        </div>

        <div className="text-center mt-16 fade-in-up-2">
          <p className="text-xs text-muted" style={{ lineHeight: 1.8 }}>
            Demo: <span className="font-mono" style={{ color: 'var(--accent)' }}>admin@retailstock.pk</span> / <span className="font-mono" style={{ color: 'var(--accent)' }}>Admin@123</span><br />
            User: <span className="font-mono" style={{ color: 'var(--accent)' }}>ahmed@kirana.pk</span> / <span className="font-mono" style={{ color: 'var(--accent)' }}>User@123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
