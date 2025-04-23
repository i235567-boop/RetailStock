import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { adminService, categoryService } from '../../services/apiServices';
import { fmtPKR, fmtDate, fmtDateTime, txnTypeLabel, getApiError, getInitials } from '../../utils/helpers';
import { LoadingState, EmptyState, Alert, LoadingButton, TxnStatusBadge, StatusBadge, RiskDot } from '../../components/common';
import Icon from '../../components/common/Icon';

const TXN_LABEL = { deposit:'Deposit', withdrawal:'Withdrawal', transfer:'Transfer', financing_settlement:'Financing', repayment:'Repayment', refund:'Refund', fee:'Fee', bill_payment:'Bill Payment' };

// ── Admin Users ───────────────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actioning, setActioning] = useState(null);
  const [msg, setMsg]           = useState({ type:'', text:'' });

  const load = useCallback(() => {
    setLoading(true);
    adminService.listUsers({ search, status: statusFilter, limit: 50 })
      .then(r => setUsers(r.data.data.users))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleBlock = async (user) => {
    setActioning(user._id);
    try {
      if (user.status === 'blocked') await adminService.unblockUser(user._id);
      else await adminService.blockUser(user._id, { reason: 'Admin action' });
      setMsg({ type:'success', text:`User ${user.status==='blocked'?'unblocked':'blocked'} successfully.` });
      load();
    } catch (err) { setMsg({ type:'error', text: getApiError(err) }); }
    finally { setActioning(null); }
  };

  return (
    <AppLayout title="Admin — Users">
      <div className="page-header anim-up">
        <div><h2>User Management</h2><p className="page-subtitle">View, search, block and unblock platform users</p></div>
      </div>
      {msg.text && <Alert type={msg.type} onDismiss={() => setMsg({ type:'',text:'' })}>{msg.text}</Alert>}
      <div className="card mb-14" style={{ padding:'12px 16px' }}>
        <div className="flex gap-10 flex-wrap">
          <div className="input-wrap" style={{ flex:'1 1 200px' }}>
            <span className="input-prefix-icon"><Icon name="search" size={13} /></span>
            <input className="form-input" placeholder="Search name, email, business…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input form-select" style={{ flex:'0 1 150px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {['active','blocked','suspended','pending'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
      </div>
      {loading ? <LoadingState /> : !users.length ? (
        <div className="card"><EmptyState icon="users" title="No users found" text="Try adjusting your search." /></div>
      ) : (
        <div className="card anim-up-1">
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Business</th><th>Role</th><th>Status</th><th>KYC</th><th>Credit Available</th><th>Joined</th><th>Action</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex gap-10 items-center">
                        <div className="avatar" style={{ background: u.role==='admin'?'var(--status-info)':'var(--brand)' }}>{getInitials(u.name)}</div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{u.name}</div>
                          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize:'0.84rem', color:'var(--text-secondary)' }}>{u.businessName||'—'}</span></td>
                    <td><StatusBadge status={u.role} /></td>
                    <td><StatusBadge status={u.status} /></td>
                    <td><StatusBadge status={u.kycStatus} /></td>
                    <td><span className="mono" style={{ fontSize:'0.84rem' }}>{fmtPKR(u.availableCredit)}</span></td>
                    <td><span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{fmtDate(u.createdAt)}</span></td>
                    <td>
                      {u.role !== 'admin' && (
                        <LoadingButton loading={actioning===u._id} className={u.status==='blocked'?'btn-success-outline btn-sm':'btn-danger btn-sm'} onClick={() => toggleBlock(u)}>
                          <Icon name={u.status==='blocked'?'check':'block'} size={12} />
                          {u.status==='blocked'?'Unblock':'Block'}
                        </LoadingButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Admin Wallets ─────────────────────────────────────────────────
export function AdminWallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminService.listWallets().then(r => setWallets(r.data.data.wallets)).finally(() => setLoading(false)); }, []);
  return (
    <AppLayout title="Admin — Wallets">
      <div className="page-header anim-up"><div><h2>All Wallets</h2><p className="page-subtitle">Platform wallet balances overview</p></div></div>
      {loading ? <LoadingState /> : (
        <div className="card anim-up-1">
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Balance</th><th>Status</th><th>Total Deposits</th><th>Total Withdrawals</th><th>Transfers In</th><th>Transfers Out</th><th>Updated</th></tr></thead>
              <tbody>
                {wallets.map(w => (
                  <tr key={w._id}>
                    <td>
                      <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{w.userId?.name}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{w.userId?.email}</div>
                    </td>
                    <td><span className="mono font-700" style={{ fontSize:'1rem' }}>{fmtPKR(w.balance)}</span></td>
                    <td><StatusBadge status={w.status} /></td>
                    <td><span className="mono" style={{ fontSize:'0.84rem' }}>{fmtPKR(w.totalDeposits)}</span></td>
                    <td><span className="mono" style={{ fontSize:'0.84rem' }}>{fmtPKR(w.totalWithdrawals)}</span></td>
                    <td><span className="mono" style={{ fontSize:'0.84rem' }}>{fmtPKR(w.totalTransfersIn)}</span></td>
                    <td><span className="mono" style={{ fontSize:'0.84rem' }}>{fmtPKR(w.totalTransfersOut)}</span></td>
                    <td><span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{fmtDate(w.updatedAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Admin Transactions ────────────────────────────────────────────
export function AdminTransactions() {
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type:'', status:'' });
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    adminService.listTransactions({ ...filters, limit:60 })
      .then(r => setTxns(r.data.data.transactions))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <AppLayout title="Admin — Transactions">
      <div className="page-header anim-up"><div><h2>All Transactions</h2><p className="page-subtitle">Platform-wide transaction log</p></div></div>
      <div className="card mb-14" style={{ padding:'12px 16px' }}>
        <div className="flex gap-10 flex-wrap">
          <select className="form-input form-select" style={{ flex:'0 1 160px' }} value={filters.type} onChange={e => setFilters(p=>({...p,type:e.target.value}))}>
            <option value="">All Types</option>
            {Object.entries(TXN_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="form-input form-select" style={{ flex:'0 1 150px' }} value={filters.status} onChange={e => setFilters(p=>({...p,status:e.target.value}))}>
            <option value="">All Status</option>
            {['successful','failed','pending','flagged'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
      </div>
      {loading ? <LoadingState /> : !txns.length ? (
        <div className="card"><EmptyState icon="transactions" title="No transactions found" /></div>
      ) : (
        <div className="card anim-up-1">
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Type</th><th>From</th><th>To</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {txns.map(t => (
                  <tr key={t._id} style={{ cursor:'pointer' }} onClick={() => navigate(`/transactions/${t._id}`)}>
                    <td><span className="mono" style={{ fontSize:'0.75rem', color:'var(--brand-light)' }}>{t.transactionId}</span></td>
                    <td style={{ fontSize:'0.875rem' }}>{TXN_LABEL[t.type]||t.type}</td>
                    <td><span style={{ fontSize:'0.84rem', color:'var(--text-secondary)' }}>{t.senderId?.name||'—'}</span></td>
                    <td><span style={{ fontSize:'0.84rem', color:'var(--text-secondary)' }}>{t.receiverId?.name||'—'}</span></td>
                    <td><span className="mono font-600">{fmtPKR(t.amount)}</span></td>
                    <td>
                      <div className="flex gap-6 items-center">
                        <TxnStatusBadge status={t.status} />
                        {t.suspiciousFlag && <span className="badge badge-flagged">Flagged</span>}
                      </div>
                    </td>
                    <td><span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{fmtDateTime(t.createdAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Admin Flagged ─────────────────────────────────────────────────
export function AdminFlagged() {
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminService.getFlaggedTransactions().then(r => setTxns(r.data.data.transactions)).finally(() => setLoading(false)); }, []);
  return (
    <AppLayout title="Admin — Flagged">
      <div className="page-header anim-up">
        <div><h2>Flagged Transactions</h2><p className="page-subtitle">Suspicious activity requiring review</p></div>
        {!loading && <span className="badge badge-flagged" style={{ fontSize:'0.78rem', padding:'5px 12px' }}>{txns.length} flagged</span>}
      </div>
      {loading ? <LoadingState /> : !txns.length ? (
        <div className="card"><EmptyState icon="check" title="No flagged transactions" text="All transactions are currently clean." /></div>
      ) : (
        <div className="card anim-up-1">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Transaction ID</th><th>User</th><th>Type</th><th>Amount</th><th>Suspicious Reasons</th><th>Date</th></tr></thead>
              <tbody>
                {txns.map(t => (
                  <tr key={t._id}>
                    <td><span className="mono" style={{ fontSize:'0.75rem', color:'var(--status-danger)' }}>{t.transactionId}</span></td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:'0.84rem' }}>{t.senderId?.name||t.receiverId?.name||'—'}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{t.senderId?.email||t.receiverId?.email}</div>
                    </td>
                    <td style={{ fontSize:'0.875rem' }}>{TXN_LABEL[t.type]||t.type}</td>
                    <td><span className="mono font-600">{fmtPKR(t.amount)}</span></td>
                    <td>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {t.suspiciousReasons?.map((r,i) => (
                          <span key={i} className="badge badge-flagged" style={{ fontSize:'0.66rem', whiteSpace:'normal', maxWidth:280 }}>{r}</span>
                        ))}
                      </div>
                    </td>
                    <td><span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{fmtDateTime(t.createdAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Admin Financing Portfolio ─────────────────────────────────────
export function AdminFinancing() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminService.getFinancingPortfolio().then(r => setRecords(r.data.data.records)).finally(() => setLoading(false)); }, []);

  const counts = { red: records.filter(r=>r.riskColor==='red').length, yellow: records.filter(r=>r.riskColor==='yellow').length, green: records.filter(r=>r.riskColor==='green').length };

  return (
    <AppLayout title="Admin — Financing Portfolio">
      <div className="page-header anim-up">
        <div><h2>Financing Portfolio</h2><p className="page-subtitle">All Murabaha financing with risk scoring</p></div>
      </div>
      {!loading && (
        <div className="grid grid-3 mb-16 anim-up-1">
          {[['green','On Track',counts.green,'success'],['yellow','Due Soon',counts.yellow,'warning'],['red','Overdue',counts.red,'danger']].map(([c,l,v,ic]) => (
            <div key={c} className="stat-card">
              <div className={`stat-icon ${ic}`}><Icon name="financing" size={15} /></div>
              <div className="stat-value">{v}</div>
              <div className="stat-label">{l}</div>
            </div>
          ))}
        </div>
      )}
      {loading ? <LoadingState /> : !records.length ? (
        <div className="card"><EmptyState icon="financing" title="No financing records" /></div>
      ) : (
        <div className="card anim-up-2">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Risk</th><th>Reference</th><th>User</th><th>Cost</th><th>Total Due</th><th>Status</th><th>Due Date</th><th>Remaining</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r._id}>
                    <td><RiskDot color={r.riskColor} /></td>
                    <td><span className="mono" style={{ fontSize:'0.75rem', color:'var(--brand-light)' }}>{r.financingUuid}</span></td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:'0.84rem' }}>{r.userId?.name}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{r.userId?.businessName}</div>
                    </td>
                    <td><span className="mono">{fmtPKR(r.costPrice)}</span></td>
                    <td><span className="mono">{fmtPKR(r.totalRepaymentAmount)}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <span style={{ fontSize:'0.82rem', color:r.riskColor==='red'?'var(--status-danger)':r.riskColor==='yellow'?'var(--status-warning)':'var(--text-muted)' }}>
                        {fmtDate(r.dueDate)}
                        {r.status==='active' && <span style={{ fontWeight:600, marginLeft:4 }}>({r.daysUntilDue<0?'Overdue':`${r.daysUntilDue}d`})</span>}
                      </span>
                    </td>
                    <td><span className="mono font-600">{fmtPKR(r.remainingBalance)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Admin Categories ──────────────────────────────────────────────
export function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState({ name:'', type:'transaction', description:'' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]               = useState({ type:'', text:'' });

  const load = () => {
    setLoading(true);
    categoryService.list().then(r => setCategories(r.data.data.categories)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name) { setMsg({ type:'error', text:'Name required.' }); return; }
    setSubmitting(true);
    try {
      await adminService.createCategory(form);
      setMsg({ type:'success', text:'Category created successfully.' });
      setForm({ name:'', type:'transaction', description:'' });
      load();
    } catch (err) { setMsg({ type:'error', text: getApiError(err) }); }
    finally { setSubmitting(false); }
  };

  const disable = async (id) => {
    try { await adminService.disableCategory(id); load(); }
    catch (err) { setMsg({ type:'error', text: getApiError(err) }); }
  };

  return (
    <AppLayout title="Admin — Categories">
      <div className="page-header anim-up"><div><h2>Category Management</h2><p className="page-subtitle">Manage transaction and expense categories</p></div></div>
      {msg.text && <Alert type={msg.type} onDismiss={() => setMsg({ type:'',text:'' })}>{msg.text}</Alert>}
      <div className="grid grid-2">
        <div className="card anim-up-1">
          <div className="card-title mb-16">Create New Category</div>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Category name" /></div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input form-select" value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}>
              <option value="transaction">Transaction</option>
              <option value="expense">Expense</option>
              <option value="budget">Budget</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Description <span style={{color:'var(--text-muted)',textTransform:'none',letterSpacing:0,fontSize:'0.72rem'}}>(optional)</span></label><input className="form-input" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} /></div>
          <LoadingButton loading={submitting} className="btn-primary btn-full" onClick={create}>
            <Icon name="apply" size={13} /> Create Category
          </LoadingButton>
        </div>
        <div className="card anim-up-2">
          <div className="card-title mb-16">Active Categories</div>
          {loading ? <LoadingState text="Loading categories…" /> : !categories.length ? (
            <EmptyState icon="categories" title="No categories yet" />
          ) : (
            <div style={{ maxHeight:380, overflowY:'auto' }}>
              {categories.map(c => (
                <div key={c._id} className="flex-between" style={{ padding:'10px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                  <div className="flex gap-10 items-center">
                    <div className="stat-icon" style={{ width:26, height:26, margin:0 }}><Icon name="categories" size={12} /></div>
                    <div>
                      <span style={{ fontWeight:600, fontSize:'0.875rem' }}>{c.name}</span>
                      <span className="badge badge-neutral" style={{ marginLeft:8 }}>{c.type}</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => disable(c._id)}>Disable</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// ── Admin Audit Logs ──────────────────────────────────────────────
export function AdminAuditLogs() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminService.getAuditLogs().then(r => setLogs(r.data.data.logs)).finally(() => setLoading(false)); }, []);
  return (
    <AppLayout title="Admin — Audit Logs">
      <div className="page-header anim-up"><div><h2>Audit Logs</h2><p className="page-subtitle">Admin action history and accountability trail</p></div></div>
      {loading ? <LoadingState /> : !logs.length ? (
        <div className="card"><EmptyState icon="audit" title="No audit logs yet" text="Admin actions will be recorded here." /></div>
      ) : (
        <div className="card anim-up-1">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Actor</th><th>Action</th><th>Target</th><th>Details</th><th>Date</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id}>
                    <td>
                      <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{l.actorId?.name||'System'}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{l.actorId?.email}</div>
                    </td>
                    <td><span className="badge badge-info">{l.action}</span></td>
                    <td><span style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{l.targetType}{l.targetId?` · …${l.targetId.slice(-6)}`:''}</span></td>
                    <td><span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{l.details?.reason||'—'}</span></td>
                    <td><span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{fmtDateTime(l.createdAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
