import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { budgetService } from '../../services/apiServices';
import { fmtPKR, getCurrentMonth, getApiError, statusBadge } from '../../utils/helpers';
import { LoadingState, Alert, LoadingButton, ProgressBar, StatusBadge, EmptyState } from '../../components/common';

function BudgetModal({ budget, onClose, onSaved }) {
  const [form, setForm] = useState({ month: budget?.month || getCurrentMonth(), totalLimit: budget?.totalLimit || '', warningThreshold: budget?.warningThreshold || 80, categoryLimits: budget?.categoryLimits || [] });
  const [catName, setCatName] = useState(''); const [catLimit, setCatLimit] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');

  const addCat = () => {
    if (!catName || !catLimit || Number(catLimit) <= 0) return;
    setForm(p => ({ ...p, categoryLimits: [...p.categoryLimits, { category: catName, limit: Number(catLimit) }] }));
    setCatName(''); setCatLimit('');
  };
  const removeCat = (i) => setForm(p => ({ ...p, categoryLimits: p.categoryLimits.filter((_, j) => j !== i) }));

  const submit = async () => {
    if (!form.totalLimit || Number(form.totalLimit) <= 0) { setError('Total limit must be > 0.'); return; }
    setLoading(true); setError('');
    try {
      if (budget?._id) await budgetService.update(budget._id, { totalLimit: Number(form.totalLimit), categoryLimits: form.categoryLimits, warningThreshold: Number(form.warningThreshold) });
      else await budgetService.create({ ...form, totalLimit: Number(form.totalLimit) });
      onSaved();
    } catch (err) { setError(getApiError(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <span className="modal-title">{budget ? 'Edit Budget' : 'Create Budget'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="form-group"><label className="form-label">Month</label><input type="month" className="form-input" value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} disabled={!!budget} /></div>
          <div className="form-group"><label className="form-label">Total Monthly Limit (PKR)</label><input type="number" min="1" className="form-input" value={form.totalLimit} onChange={e => setForm(p => ({ ...p, totalLimit: e.target.value }))} /></div>
        </div>
        <div className="form-group"><label className="form-label">Warning at (%)</label><input type="number" min="1" max="99" className="form-input" value={form.warningThreshold} onChange={e => setForm(p => ({ ...p, warningThreshold: e.target.value }))} /></div>

        <div className="form-group">
          <label className="form-label">Category Limits (Optional)</label>
          <div className="flex gap-8 mb-8">
            <select className="form-input form-select" style={{ flex: 2 }} value={catName} onChange={e => setCatName(e.target.value)}>
              <option value="">Select category...</option>
              {['Food','Transport','Utilities','Rent','Supplies','Miscellaneous','Entertainment','Health','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" min="1" className="form-input" style={{ flex: 1 }} placeholder="Limit" value={catLimit} onChange={e => setCatLimit(e.target.value)} />
            <button className="btn btn-secondary btn-sm" onClick={addCat}>+</button>
          </div>
          {form.categoryLimits.map((cl, i) => (
            <div key={i} className="flex-between" style={{ padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 8, marginBottom: 6 }}>
              <span className="text-small">{cl.category}</span>
              <div className="flex gap-8 items-center">
                <span className="money text-small">{fmtPKR(cl.limit)}</span>
                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => removeCat(i)}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <LoadingButton loading={loading} className="btn-primary" style={{ flex: 2 }} onClick={submit}>{budget ? 'Save Changes' : 'Create Budget'}</LoadingButton>
        </div>
      </div>
    </div>
  );
}

export default function Budgets() {
  const [current, setCurrent] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cur, list] = await Promise.all([budgetService.getCurrent(), budgetService.list()]);
      setCurrent(cur.data.data.budget);
      setBudgets(list.data.data.budgets);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try { await budgetService.delete(id); load(); }
    catch (err) { setMsg(getApiError(err)); }
  };

  if (loading) return <AppLayout title="Budgets"><LoadingState /></AppLayout>;

  return (
    <AppLayout title="Budgets">
      <div className="page-header fade-in-up">
        <div><h2>Budget Manager</h2><p className="page-subtitle">Control your monthly spending</p></div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>➕ New Budget</button>
      </div>

      {msg && <Alert type="error" onDismiss={() => setMsg('')}>{msg}</Alert>}

      {/* Current month */}
{current ? (
  <div className="card mb-20 fade-in-up-1">
    
    {/* Header */}
    <div
      className="flex-between"
      style={{
        alignItems: 'flex-start',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 22,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          className="card-title"
          style={{
            lineHeight: 1.5,
            fontSize: '1.05rem',
          }}
        >
          📅 {current.month} — Current Month
        </div>

        <div
          className="card-subtitle"
          style={{
            fontSize: '0.92rem',
            lineHeight: 1.6,
          }}
        >
          Total limit:&nbsp;

          <span
            className="money"
            style={{
              fontWeight: 700,
            }}
          >
            {fmtPKR(current.totalLimit)}
          </span>
        </div>
      </div>

      <div
        className="flex gap-8 items-center"
        style={{
          marginTop: 2,
        }}
      >
        <StatusBadge status={current.status} />

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setModal(current)}
        >
          ✏️
        </button>
      </div>
    </div>

    {/* Progress */}
    <div
      style={{
        marginTop: 12,
        marginBottom: 20,
      }}
    >
      <ProgressBar
        value={current.spentAmount}
        max={current.totalLimit}
      />
    </div>

    {/* Stats */}
    <div
      className="flex-between text-small"
      style={{
        gap: 18,
        flexWrap: 'wrap',
        lineHeight: 1.8,
      }}
    >
      <span className="text-muted">
        Spent:&nbsp;

        <span
          className="money text-danger"
          style={{
            fontWeight: 700,
          }}
        >
          {fmtPKR(current.spentAmount)}
        </span>
      </span>

      <span className="text-muted">
        Remaining:&nbsp;

        <span
          className="money text-success"
          style={{
            fontWeight: 700,
          }}
        >
          {fmtPKR(
            Math.max(
              0,
              current.totalLimit - current.spentAmount
            )
          )}
        </span>
      </span>
    </div>

    {/* Category limits */}
    {current.categoryLimits?.length > 0 && (
      <>
        <div className="divider" />

        <div
          className="card-title mb-12"
          style={{
            marginTop: 10,
          }}
        >
          Category Limits
        </div>

        <div
          className="grid grid-2"
          style={{
            gap: 12,
          }}
        >
          {current.categoryLimits.map(cl => (
            <div
              key={cl.category}
              className="card-sm"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                padding: 14,
                borderRadius: 14,
              }}
            >
              <div className="flex-between mb-8">
                <span
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 600,
                  }}
                >
                  {cl.category}
                </span>

                <span className="text-xs text-muted">
                  {fmtPKR(cl.limit)}
                </span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill safe"
                  style={{ width: '30%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </>
    )}

    {/* Warnings */}
    {current.status === 'nearLimit' && (
      <div className="alert alert-warning mt-16">
        <span>⚠️</span>

        <span>
          You're approaching your monthly budget limit.
          Consider reducing spending.
        </span>
      </div>
    )}

    {current.status === 'exceeded' && (
      <div className="alert alert-error mt-16">
        <span>❌</span>

        <span>
          Monthly budget exceeded! Review your expenses
          immediately.
        </span>
      </div>
    )}
  </div>
) : (
  <div className="card mb-20 fade-in-up-1">
    <EmptyState
      icon="📊"
      title="No budget for this month"
      text="Create a budget to track your spending."
      action={
        <button
          className="btn btn-primary mt-16"
          onClick={() => setModal('create')}
        >
          Create Budget
        </button>
      }
    />
  </div>
)}

      {/* Budget history */}
      {budgets.length > 1 && (
        <div className="card fade-in-up-2">
          <div className="card-title mb-16">Budget History</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Month</th><th>Total Limit</th><th>Spent</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {budgets.filter(b => b.month !== current?.month).map(b => (
                  <tr key={b._id}>
                    <td className="font-mono">{b.month}</td>
                    <td><span className="money">{fmtPKR(b.totalLimit)}</span></td>
                    <td><span className="money">{fmtPKR(b.spentAmount)}</span></td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal(b)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <BudgetModal
          budget={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </AppLayout>
  );
}
