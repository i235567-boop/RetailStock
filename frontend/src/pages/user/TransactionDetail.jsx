import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { txnService } from '../../services/apiServices';
import { fmtPKR, fmtDateTime, txnBadge, txnTypeLabel } from '../../utils/helpers';
import { LoadingState, TxnStatusBadge } from '../../components/common';

export default function TransactionDetail() {
  const { id } = useParams();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    txnService.getById(id).then(r => setTxn(r.data.data.transaction)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AppLayout title="Receipt"><LoadingState /></AppLayout>;
  if (!txn) return <AppLayout title="Receipt"><div className="card"><p className="text-muted text-center">Transaction not found.</p></div></AppLayout>;

  return (
    <AppLayout title="Transaction Receipt">
      <div className="page-header fade-in-up">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
      </div>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div className="card fade-in-up-1">
          <div className="text-center mb-24">
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>
              {txn.status === 'successful' ? '✅' : txn.status === 'failed' ? '❌' : txn.status === 'flagged' ? '🚩' : '⏳'}
            </div>
            <h3>{txnTypeLabel(txn.type)}</h3>
            <div className="money-lg" style={{ margin: '12px 0', color: 'var(--text-primary)' }}>{fmtPKR(txn.amount)}</div>
            <TxnStatusBadge status={txn.status} />
          </div>

          <div className="murabaha-breakdown">
            {[
              ['Transaction ID', <span className="font-mono text-xs" style={{ color: 'var(--text-accent)' }}>{txn.transactionId}</span>],
              ['Type', txnTypeLabel(txn.type)],
              ['Status', <TxnStatusBadge status={txn.status} />],
              ['Amount', <span className="money">{fmtPKR(txn.amount)}</span>],
              ['Category', txn.category],
              ['Date', fmtDateTime(txn.createdAt)],
              txn.senderId?.name && ['From', txn.senderId.name],
              txn.receiverId?.name && ['To', txn.receiverId.name],
              txn.description && ['Description', txn.description],
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} className="murabaha-row">
                <span className="murabaha-row-label">{label}</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 500, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>

          {txn.suspiciousFlag && (
            <div className="alert alert-warning mt-16">
              <span>🚩</span>
              <div>
                <strong>Flagged Transaction</strong>
                {txn.suspiciousReasons?.map((r, i) => <div key={i} className="text-small mt-4">{r}</div>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
