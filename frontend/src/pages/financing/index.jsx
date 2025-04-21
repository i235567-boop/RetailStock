import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { financingService } from '../../services/apiServices';
import { useAuth } from '../../context/AuthContext';
import { fmtPKR, fmtDate, getApiError, statusBadge } from '../../utils/helpers';
import { LoadingState, EmptyState, Alert, MurabahaBreakdown, LoadingButton, StatusBadge, RiskDot } from '../../components/common';

// ── Financing List ────────────────────────────────────────────────
export function FinancingList() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => { financingService.getHistory().then(r => setRecords(r.data.data.records)).finally(() => setLoading(false)); }, []);
  if (loading) return <AppLayout title="My Financing"><LoadingState /></AppLayout>;
  return (
    <AppLayout title="My Financing">
      <div className="page-header fade-in-up">
        <div><h2>Financing History</h2><p className="page-subtitle">All Murabaha financing records</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/financing/apply')}>⚡ Apply Now</button>
      </div>
      {!records.length ? (
        <div className="card"><EmptyState icon="🏦" title="No financing records" text="Apply for Murabaha financing to get started." action={<button className="btn btn-primary mt-16" onClick={() => navigate('/financing/apply')}>Apply Now</button>} /></div>
      ) : (
        <div className="card fade-in-up-1">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Reference</th><th>Amount</th><th>Total Due</th><th>Status</th><th>Due Date</th><th>Remaining</th><th></th></tr></thead>
              <tbody>
                {records.map(r => {
                  const daysLeft = Math.round((new Date(r.dueDate) - Date.now()) / (1000*60*60*24));
                  const overdue = r.status === 'active' && daysLeft < 0;
                  return (
                    <tr key={r._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/financing/${r._id}`)}>
                      <td><span className="font-mono text-xs" style={{ color: 'var(--text-accent)' }}>{r.financingUuid}</span></td>
                      <td><span className="money">{fmtPKR(r.costPrice)}</span></td>
                      <td><span className="money">{fmtPKR(r.totalRepaymentAmount)}</span></td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        <span className={overdue ? 'text-danger' : daysLeft <= 3 ? 'text-warning' : 'text-muted'} style={{ fontSize: '0.84rem' }}>
                          {fmtDate(r.dueDate)} {r.status === 'active' && `(${overdue ? 'Overdue' : `${daysLeft}d`})`}
                        </span>
                      </td>
                      <td><span className="money" style={{ fontWeight: 600 }}>{fmtPKR(r.remainingBalance)}</span></td>
                      <td>{r.status === 'active' && <button className="btn btn-sm btn-primary" onClick={e => { e.stopPropagation(); navigate(`/financing/${r._id}/repay`); }}>Repay</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Apply Wizard ──────────────────────────────────────────────────
const DURATIONS = [{ days: 7, label: '7 Days', rate: '2.5%' }, { days: 14, label: '14 Days', rate: '5%' }, { days: 21, label: '21 Days', rate: '7.5%' }, { days: 30, label: '30 Days', rate: '10%' }];

export function FinancingApply() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ amount: '', durationDays: 14, purpose: 'inventory', productCategory: 'General' });
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const getQuote = async () => {
    setError('');
    if (!form.amount || Number(form.amount) <= 0) { setError('Enter a valid amount.'); return; }
    if (Number(form.amount) > user?.availableCredit) { setError(`Amount exceeds available credit of ${fmtPKR(user?.availableCredit)}.`); return; }
    setLoading(true);
    try {
      const r = await financingService.getQuote({ amount: form.amount, durationDays: form.durationDays });
      setQuote(r.data.data);
      setStep(1);
    } catch (err) { setError(getApiError(err)); }
    finally { setLoading(false); }
  };

  const apply = async () => {
    setSubmitting(true); setError('');
    try {
      await financingService.apply({ amount: Number(form.amount), durationDays: Number(form.durationDays), purpose: form.purpose, productCategory: form.productCategory });
      await refreshUser();
      setSuccess(true); setStep(2);
    } catch (err) { setError(getApiError(err)); }
    finally { setSubmitting(false); }
  };

  return (
    <AppLayout title="Apply for Financing">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="page-header fade-in-up">
          <div><h2>Murabaha Financing</h2><p className="page-subtitle">Shariah-compliant inventory financing</p></div>
        </div>

        {/* Step bar */}
        <div className="flex gap-8 mb-24 fade-in-up-1">
          {['Amount & Terms', 'Review Contract', 'Confirmed'].map((s, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 2, background: i <= step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s', marginBottom: 6 }} />
              <div className="text-xs text-muted text-center">{s}</div>
            </div>
          ))}
        </div>

        {error && <Alert type="error" onDismiss={() => setError('')}>{error}</Alert>}

        {step === 0 && (
          <div className="card fade-in-up-2">
            <div className="alert alert-info mb-20">
              <span>⚡</span><span>Available credit: <strong>{fmtPKR(user?.availableCredit)}</strong></span>
            </div>
            <div className="form-group">
              <label className="form-label">Financing Amount (PKR)</label>
              <div className="input-wrap">
                <span className="input-icon">₨</span>
                <input type="number" className="form-input" placeholder="e.g. 25000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} min="1" max={user?.availableCredit} />
              </div>
              <div className="form-hint">Max: {fmtPKR(user?.availableCredit)}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Repayment Duration</label>
              <div className="grid grid-4" style={{ gap: 10 }}>
                {DURATIONS.map(d => (
                  <div key={d.days} onClick={() => setForm(p => ({ ...p, durationDays: d.days }))} style={{ padding: '12px 8px', border: `2px solid ${form.durationDays === d.days ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center', background: form.durationDays === d.days ? 'var(--primary-glow)' : 'var(--bg-input)', transition: 'all 0.15s' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: form.durationDays === d.days ? 'var(--primary-light)' : 'var(--text-primary)' }}>{d.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.rate} markup</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Purpose</label>
              <select className="form-input form-select" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}>
                <option value="inventory">Inventory Restocking</option>
                <option value="seasonal">Seasonal Opportunity</option>
                <option value="new_product">New Product Line</option>
                <option value="emergency">Emergency Stock</option>
              </select>
            </div>
            <LoadingButton loading={loading} className="btn-primary btn-full btn-lg" onClick={getQuote}>Get Quote →</LoadingButton>
          </div>
        )}

        {step === 1 && quote && (
          <div className="card fade-in-up-2">
            <div className="card-title mb-16">📄 Murabaha Contract Terms</div>
            <div className="alert alert-info mb-16">
              <span>ℹ</span><span>This is a Shariah-compliant cost-plus-markup (Murabaha) financing agreement. All terms are calculated on the backend.</span>
            </div>
            <MurabahaBreakdown {...quote.terms} />
            <div className="card-sm mt-16" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              <div className="flex-between text-small mb-8"><span className="text-muted">Due Date</span><span className="font-mono">{fmtDate(quote.terms.dueDate)}</span></div>
              <div className="flex-between text-small"><span className="text-muted">Duration</span><span>{quote.terms.durationDays} days</span></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(0)}>← Revise</button>
              <LoadingButton loading={submitting} className="btn-primary" style={{ flex: 2 }} onClick={apply}>Confirm & Sign ✓</LoadingButton>
            </div>
          </div>
        )}

        {step === 2 && success && (
          <div className="card fade-in-up-2 text-center">
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
            <h3>Financing Approved!</h3>
            <p className="text-muted mt-8 mb-24">Your Murabaha financing has been approved and funds added to your wallet.</p>
            <div className="flex gap-12" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/financing')}>View Records</button>
              <button className="btn btn-primary" onClick={() => navigate('/wallet')}>Go to Wallet</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── Repayment Page ────────────────────────────────────────────────
export function RepaymentPage() {
  const { id } = useParams ? useParams() : { id: null };
  const [financing, setFinancing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState('auto_debit');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    financingService.getById(id).then(r => setFinancing(r.data.data.financing)).finally(() => setLoading(false));
  }, [id]);

  const pay = async () => {
    setError(''); setSubmitting(true);
    try {
      await financingService.makeRepayment({ financingId: id, amount: financing.remainingBalance, paymentMethod: method });
      setSuccess(true);
    } catch (err) { setError(getApiError(err)); }
    finally { setSubmitting(false); }
  };

  if (loading) return <AppLayout title="Repayment"><LoadingState /></AppLayout>;

  return (
    <AppLayout title="Make Repayment">
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {success ? (
          <div className="card text-center fade-in-up">
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
            <h3>Repayment Successful!</h3>
            <p className="text-muted mt-8 mb-24">Credit has been restored to your account.</p>
            <button className="btn btn-primary" onClick={() => navigate('/financing')}>← Back to Financing</button>
          </div>
        ) : (
          <div className="card fade-in-up">
            <div className="card-title mb-4">Repay Financing</div>
            <div className="text-muted text-small mb-20 font-mono">{financing?.financingUuid}</div>
            {error && <Alert type="error">{error}</Alert>}
            <div className="murabaha-breakdown mb-20">
              <div className="murabaha-row"><span className="murabaha-row-label">Total Financing</span><span className="murabaha-row-value">{fmtPKR(financing?.totalRepaymentAmount)}</span></div>
              <div className="murabaha-row"><span className="murabaha-row-label">Already Repaid</span><span className="murabaha-row-value">{fmtPKR(financing?.repaidAmount)}</span></div>
              <div className="murabaha-row total"><span className="murabaha-row-label">Remaining Balance</span><span className="murabaha-row-value">{fmtPKR(financing?.remainingBalance)}</span></div>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              {['auto_debit', 'jazzcash', 'easypaisa', 'cash_deposit'].map(m => (
                <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${method === m ? 'var(--primary)' : 'var(--border)'}`, marginBottom: 8, cursor: 'pointer', background: method === m ? 'var(--primary-glow)' : 'var(--bg-input)', transition: 'all 0.15s' }}>
                  <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} style={{ accentColor: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{{ auto_debit: '🏦 Auto-Debit (Wallet)', jazzcash: '📱 JazzCash', easypaisa: '📱 EasyPaisa', cash_deposit: '💵 Cash Deposit' }[m]}</span>
                </label>
              ))}
            </div>
            <LoadingButton loading={submitting} className="btn-primary btn-full btn-lg" onClick={pay}>
              Pay {fmtPKR(financing?.remainingBalance)}
            </LoadingButton>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// need useParams import at top for RepaymentPage
import { useParams } from 'react-router-dom';
