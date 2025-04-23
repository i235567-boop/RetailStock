import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { expenseService } from '../../services/apiServices';
import { fmtPKR, fmtDate, getApiError } from '../../utils/helpers';
import { LoadingState, EmptyState, Alert, LoadingButton } from '../../components/common';

function ExpenseModal({ expense, onClose, onSaved }) {
  const [form, setForm] = useState({ title: expense?.title || '', amount: expense?.amount || '', category: expense?.category || 'Food', paymentMethod: expense?.paymentMethod || 'Cash', date: expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0], notes: expense?.notes || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async () => {
    if (!form.title || !form.amount || Number(form.amount) <= 0) { setError('Title and valid amount required.'); return; }
    setLoading(true); setError('');
    try {
      if (expense?._id) await expenseService.update(expense._id, { ...form, amount: Number(form.amount) });
      else await expenseService.create({ ...form, amount: Number(form.amount) });
      onSaved();
    } catch (err) { setError(getApiError(err)); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{expense ? '✏️ Edit Expense' : '➕ Add Expense'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <Alert type="error" onDismiss={() => setError('')}>{error}</Alert>}
        <div className="form-group"><label className="form-label">Title</label><input name="title" className="form-input" placeholder="Expense description" value={form.title} onChange={handle} /></div>
        <div className="form-group"><label className="form-label">Amount (PKR)</label><input name="amount" type="number" min="1" className="form-input" placeholder="0" value={form.amount} onChange={handle} /></div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="category" className="form-input form-select" value={form.category} onChange={handle}>
              {['Food','Transport','Utilities','Rent','Supplies','Miscellaneous','Entertainment','Health','Education','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select name="paymentMethod" className="form-input form-select" value={form.paymentMethod} onChange={handle}>
              {['Cash','Wallet','JazzCash','EasyPaisa','Bank'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Date</label><input name="date" type="date" className="form-input" value={form.date} onChange={handle} /></div>
        <div className="form-group"><label className="form-label">Notes (Optional)</label><input name="notes" className="form-input" placeholder="Any notes..." value={form.notes} onChange={handle} /></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <LoadingButton loading={loading} className="btn-primary" style={{ flex: 2 }} onClick={submit}>{expense ? 'Save Changes' : 'Add Expense'}</LoadingButton>
        </div>
      </div>
    </div>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | expense object
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState('');
  const [filters, setFilters] = useState({ category: '', search: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, cat] = await Promise.all([expenseService.list(filters), expenseService.getCategorySummary()]);
      setExpenses(list.data.data.expenses);
      setSummary(cat.data.data.categories);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    setDeleting(id);
    try { await expenseService.delete(id); setMsg('Expense deleted.'); load(); }
    catch (err) { setMsg(getApiError(err)); }
    finally { setDeleting(null); }
  };

  const totalMonthly = summary.reduce((s, c) => s + c.total, 0);

  return (
    <AppLayout title="Expenses">
      <div className="page-header fade-in-up">
        <div><h2>Expense Tracker</h2><p className="page-subtitle">Track your business spending</p></div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>➕ Add Expense</button>
      </div>

      {msg && <Alert type="success" onDismiss={() => setMsg('')}>{msg}</Alert>}

      {/* Category summary */}
      {summary.length > 0 && (
        <div className="card mb-20 fade-in-up-1">
          <div className="flex-between mb-16">
            <div className="card-title">This Month: {fmtPKR(totalMonthly)}</div>
          </div>
          <div className="grid grid-4" style={{ gap: 10 }}>
            {summary.slice(0, 8).map(c => (
              <div key={c._id} className="card-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{c._id}</div>
                <div className="money" style={{ fontSize: '0.95rem', fontWeight: 700 }}>{fmtPKR(c.total)}</div>
                <div className="text-xs text-muted">{c.count} entries</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-16 fade-in-up-2" style={{ padding: '14px 20px' }}>
        <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: '1 1 180px' }} placeholder="🔍 Search expenses..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
          <select className="form-input form-select" style={{ flex: '0 1 160px' }} value={filters.category} onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}>
            <option value="">All Categories</option>
            {['Food','Transport','Utilities','Rent','Supplies','Miscellaneous','Entertainment','Health','Education','Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? <LoadingState /> : !expenses.length ? (
        <div className="card"><EmptyState icon="🧾" title="No expenses found" text="Start tracking your business expenses." action={<button className="btn btn-primary mt-16" onClick={() => setModal('add')}>Add First Expense</button>} /></div>
      ) : (
        <div className="card fade-in-up-3">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Amount</th><th>Category</th><th>Payment</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e._id}>
                    <td><div style={{ fontWeight: 500 }}>{e.title}</div>{e.notes && <div className="text-xs text-muted">{e.notes}</div>}</td>
                    <td><span className="money" style={{ fontWeight: 700 }}>{fmtPKR(e.amount)}</span></td>
                    <td><span className="badge badge-neutral">{e.category}</span></td>
                    <td><span className="text-small text-muted">{e.paymentMethod}</span></td>
                    <td><span className="text-small text-muted">{fmtDate(e.date)}</span></td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal(e)}>✏️</button>
                        <button className="btn btn-danger btn-sm" disabled={deleting === e._id} onClick={() => handleDelete(e._id)}>
                          {deleting === e._id ? <span className="spinner spinner-sm" /> : '🗑️'}
                        </button>
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
        <ExpenseModal
          expense={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setMsg(modal === 'add' ? 'Expense added!' : 'Expense updated!'); load(); }}
        />
      )}
    </AppLayout>
  );
}
