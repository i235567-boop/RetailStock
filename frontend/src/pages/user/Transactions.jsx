import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { txnService } from '../../services/apiServices';
import { fmtPKR, fmtDateTime, txnBadge, txnTypeLabel } from '../../utils/helpers';
import { LoadingState, EmptyState, TxnStatusBadge } from '../../components/common';

export default function Transactions() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '', search: '' });
  const [meta, setMeta] = useState({});
  const navigate = useNavigate();

  const load = (f = filters) => {
    setLoading(true);
    txnService.list({ ...f, limit: 30 })
      .then(r => { setTxns(r.data.data.transactions); setMeta(r.data.meta || {}); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (e) => {
    const nf = { ...filters, [e.target.name]: e.target.value };
    setFilters(nf); load(nf);
  };

  return (
    <AppLayout title="Transactions">
      <div className="page-header fade-in-up">
        <div>
          <h2>Transaction History</h2>
          <p className="page-subtitle">All your wallet activity</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-20 fade-in-up-1">
        <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
          <input name="search" className="form-input" style={{ flex: '1 1 200px' }} placeholder="🔍 Search by ID or description..." value={filters.search} onChange={handleFilter} />
          <select name="type" className="form-input form-select" style={{ flex: '0 1 160px' }} value={filters.type} onChange={handleFilter}>
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer">Transfer</option>
            <option value="financing_settlement">Financing</option>
            <option value="repayment">Repayment</option>
          </select>
          <select name="status" className="form-input form-select" style={{ flex: '0 1 160px' }} value={filters.status} onChange={handleFilter}>
            <option value="">All Status</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="flagged">Flagged</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {loading ? <LoadingState /> : !txns.length ? (
        <div className="card"><EmptyState icon="📋" title="No transactions found" text="Try adjusting your filters." /></div>
      ) : (
        <div className="card fade-in-up-2">
          <div className="flex-between mb-16">
            <span className="text-muted text-small">{meta.total || txns.length} transactions</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th><th>Type</th><th>Amount</th><th>Status</th><th>Category</th><th>Date</th><th></th>
                </tr>
              </thead>
              <tbody>
                {txns.map(t => (
                  <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/transactions/${t._id}`)}>
                    <td><span className="font-mono text-xs" style={{ color: 'var(--text-accent)' }}>{t.transactionId}</span></td>
                    <td>{txnTypeLabel(t.type)}</td>
                    <td><span className="money" style={{ fontWeight: 700 }}>{fmtPKR(t.amount)}</span></td>
                    <td><TxnStatusBadge status={t.status} /></td>
                    <td><span className="text-small text-muted">{t.category}</span></td>
                    <td><span className="text-small text-muted">{fmtDateTime(t.createdAt)}</span></td>
                    <td>
                      {t.suspiciousFlag && <span className="badge badge-flagged">🚩 Flagged</span>}
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
