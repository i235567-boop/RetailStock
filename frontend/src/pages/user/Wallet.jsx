import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { walletService } from '../../services/apiServices';
import { fmtPKR, fmtDate, txnBadge, txnTypeLabel, getApiError } from '../../utils/helpers';
import { LoadingState, Alert, LoadingButton, TxnStatusBadge } from '../../components/common';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'deposit'|'withdraw'|'transfer'
  const [form, setForm] = useState({ amount: '', description: '', receiverEmail: '', category: 'General' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    try {
      const [w, s] = await Promise.all([walletService.getWallet(), walletService.getSummary()]);
      setWallet(w.data.data.wallet);
      setTxns(s.data.data.recentTransactions || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const closeModal = () => { setModal(null); setForm({ amount: '', description: '', receiverEmail: '', category: 'General' }); setMsg({ type: '', text: '' }); };

  const submit = async () => {
    setMsg({ type: '', text: '' });
    if (!form.amount || Number(form.amount) <= 0) { setMsg({ type: 'error', text: 'Amount must be greater than zero.' }); return; }
    setSubmitting(true);
    try {
      if (modal === 'deposit') await walletService.deposit({ amount: Number(form.amount), description: form.description, category: form.category });
      else if (modal === 'withdraw') await walletService.withdraw({ amount: Number(form.amount), description: form.description, category: form.category });
      else if (modal === 'transfer') {
        if (!form.receiverEmail) { setMsg({ type: 'error', text: 'Receiver email required.' }); setSubmitting(false); return; }
        await walletService.transfer({ receiverEmail: form.receiverEmail, amount: Number(form.amount), description: form.description });
      }
      setMsg({ type: 'success', text: `${modal.charAt(0).toUpperCase() + modal.slice(1)} successful!` });
      await load();
      setTimeout(closeModal, 1500);
    } catch (err) {
      setMsg({ type: 'error', text: getApiError(err) });
    } finally { setSubmitting(false); }
  };

  if (loading) return <AppLayout title="Wallet"><LoadingState /></AppLayout>;

  return (
    <AppLayout title="Wallet">
      <div className="page-header fade-in-up">
        <div>
          <h2>My Wallet</h2>
          <p className="page-subtitle">Manage your demo wallet balance</p>
        </div>
      </div>

      {/* Wallet card */}
      <div className="wallet-card mb-24 fade-in-up-1">
        <div className="wallet-balance-label">Current Balance</div>
       <div
  className="wallet-balance"
  style={{
    marginTop: 12,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: '18px 22px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    backdropFilter: 'blur(10px)',
  }}
>
  <span
    className="pkr-unit"
    style={{
      fontSize: '1rem',
      opacity: 0.8,
      letterSpacing: '0.5px',
    }}
  >
    PKR
  </span>

  <span
    style={{
      fontSize: '2rem',
      fontWeight: 800,
      lineHeight: 1,
    }}
  >
    {(wallet?.balance || 0).toLocaleString()}
  </span>
</div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-accent btn-sm" onClick={() => setModal('deposit')}>⬇ Deposit</button>
          <button className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }} onClick={() => setModal('withdraw')}>⬆ Withdraw</button>
          <button className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }} onClick={() => setModal('transfer')}>↔ Transfer</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4 mb-24 fade-in-up-2">
        {[
          { label: 'Total Deposits', value: fmtPKR(wallet?.totalDeposits), icon: '⬇', cls: 'success' },
          { label: 'Total Withdrawals', value: fmtPKR(wallet?.totalWithdrawals), icon: '⬆', cls: 'danger' },
          { label: 'Transfers In', value: fmtPKR(wallet?.totalTransfersIn), icon: '📥', cls: 'cyan' },
          { label: 'Transfers Out', value: fmtPKR(wallet?.totalTransfersOut), icon: '📤', cls: '' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="card fade-in-up-3">
        <div className="card-title mb-16">Recent Activity</div>
        {!txns.length ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-title">No transactions yet</div>
          </div>
        ) : txns.map(t => (
          <div key={t._id} className="flex-between" style={{ padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="flex gap-12 items-center">
              <div style={{ width: 34, height: 34, borderRadius: 9, background: ['deposit','financing_settlement'].includes(t.type) ? 'var(--success-bg)' : 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                {['deposit','financing_settlement'].includes(t.type) ? '⬇' : '⬆'}
              </div>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 500 }}>{txnTypeLabel(t.type)}</div>
                <div className="text-xs text-muted font-mono">{t.transactionId}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="money" style={{ fontSize: '0.9rem', fontWeight: 700 }}>{fmtPKR(t.amount)}</div>
              <TxnStatusBadge status={t.status} />
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal && (
        <Modal title={{ deposit: '⬇ Deposit Funds', withdraw: '⬆ Withdraw Funds', transfer: '↔ Transfer Funds' }[modal]} onClose={closeModal}>
          {msg.text && <Alert type={msg.type} onDismiss={() => setMsg({ type: '', text: '' })}>{msg.text}</Alert>}
          {wallet?.balance < 5000 && modal !== 'deposit' && (
            <div className="alert alert-warning mb-16"><span>⚠</span><span>Low balance: {fmtPKR(wallet?.balance)}</span></div>
          )}
          <div className="form-group">
            <label className="form-label">Amount (PKR)</label>
            <div className="input-wrap">
              <span className="input-icon">₨</span>
              <input name="amount" type="number" min="1" className="form-input" placeholder="Enter amount" value={form.amount} onChange={handle} />
            </div>
            {modal === 'withdraw' && wallet && (
              <div className="form-hint">Available: {fmtPKR(wallet.balance)}</div>
            )}
          </div>
          {modal === 'transfer' && (
            <div className="form-group">
              <label className="form-label">Receiver Email</label>
              <input name="receiverEmail" type="email" className="form-input" placeholder="receiver@example.com" value={form.receiverEmail} onChange={handle} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input name="description" className="form-input" placeholder="Note..." value={form.description} onChange={handle} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
            <LoadingButton loading={submitting} className="btn-primary" style={{ flex: 2 }} onClick={submit}>
              Confirm {modal.charAt(0).toUpperCase() + modal.slice(1)}
            </LoadingButton>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
