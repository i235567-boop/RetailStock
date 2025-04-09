import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/helpers';
import { LoadingButton, Alert } from '../../components/common';

const STEPS = ['Account', 'Business', 'Review'];

export default function Register() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '', businessName: '', businessType: 'kirana', businessAddress: '', cnicNumber: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.name) e.name = 'Full name required';
      if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
      if (!form.phone || form.phone.length < 10) e.phone = 'Valid phone required';
      if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
      if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    }
    if (step === 1) {
      if (!form.businessName) e.businessName = 'Business name required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const submit = async () => {
    setApiError('');
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone, businessName: form.businessName, businessType: form.businessType, businessAddress: form.businessAddress, cnicNumber: form.cnicNumber || undefined });
      navigate('/dashboard');
    } catch (err) {
      setApiError(getApiError(err));
      setStep(0);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div className="text-center mb-24 fade-in-up">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: 14, fontSize: '1.3rem', marginBottom: 16, boxShadow: 'var(--shadow-glow)' }}>RS</div>
          <h2>Create your account</h2>
          <p className="text-muted text-small">Join RetailStock — grow your store, access financing</p>
        </div>

        {/* Step indicators */}
        <div className="flex gap-8 mb-24 fade-in-up-1">
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />
          ))}
        </div>

        <div className="card fade-in-up-2">
          <div className="flex-between mb-16">
            <h4>Step {step + 1}: {STEPS[step]}</h4>
            <span className="text-xs text-muted">{step + 1} / {STEPS.length}</span>
          </div>

          {apiError && <Alert type="error" onDismiss={() => setApiError('')}>{apiError}</Alert>}

          {step === 0 && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="Ahmed Khan" value={form.name} onChange={handle} />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input name="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@example.com" value={form.email} onChange={handle} />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input name="phone" className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="0300 1234567" value={form.phone} onChange={handle} />
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input name="password" type="password" className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Min 6 characters" value={form.password} onChange={handle} />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input name="confirm" type="password" className={`form-input ${errors.confirm ? 'error' : ''}`} placeholder="Repeat password" value={form.confirm} onChange={handle} />
                {errors.confirm && <div className="form-error">{errors.confirm}</div>}
              </div>
              <button className="btn btn-primary btn-full" onClick={next}>Continue →</button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input name="businessName" className={`form-input ${errors.businessName ? 'error' : ''}`} placeholder="Ahmed Kirana Store" value={form.businessName} onChange={handle} />
                {errors.businessName && <div className="form-error">{errors.businessName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Business Type</label>
                <select name="businessType" className="form-input form-select" value={form.businessType} onChange={handle}>
                  <option value="kirana">Kirana Store</option>
                  <option value="general">General Store</option>
                  <option value="mini_mart">Mini Mart</option>
                  <option value="departmental">Departmental</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Business Address</label>
                <input name="businessAddress" className="form-input" placeholder="Street, City" value={form.businessAddress} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">CNIC (Optional)</label>
                <input name="cnicNumber" className="form-input" placeholder="42101-1234567-1" value={form.cnicNumber} onChange={handle} />
              </div>
              <div className="flex gap-12">
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={back}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={next}>Review →</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="card-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', marginBottom: 16 }}>
                {[['Name', form.name], ['Email', form.email], ['Phone', form.phone], ['Business', form.businessName], ['Type', form.businessType]].map(([l, v]) => (
                  <div key={l} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.86rem' }}>
                    <span className="text-muted">{l}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="alert alert-info mb-16">
                <span>ℹ</span>
                <span>Initial credit limit: <strong>PKR 50,000</strong>. Complete KYC to unlock higher limits.</span>
              </div>
              <div className="flex gap-12">
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={back}>← Back</button>
                <LoadingButton loading={loading} className="btn-primary" style={{ flex: 2 }} onClick={submit}>
                  Create Account 🚀
                </LoadingButton>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-16">
          <span className="text-muted text-small">Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600, fontSize: '0.85rem' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
