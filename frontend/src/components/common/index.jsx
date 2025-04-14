import { fmtPKR, fmtDate, txnBadge, txnTypeLabel, statusBadge } from '../../utils/helpers';

// Loading state
export function LoadingState({ text = 'Loading...' }) {
  return (
    <div className="loading-center">
      <div className="spinner spinner-lg" />
      <span className="loading-text">{text}</span>
    </div>
  );
}

// Empty state
export function EmptyState({ icon = '📭', title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title || 'Nothing here yet'}</div>
      <div className="empty-state-text">{text || 'No data to display.'}</div>
      {action}
    </div>
  );
}

// Alert banner
export function Alert({ type = 'info', children, onDismiss }) {
  const classes = { success: 'alert-success', error: 'alert-error', warning: 'alert-warning', info: 'alert-info' };
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  return (
    <div className={`alert ${classes[type]}`} style={{ marginBottom: 16 }}>
      <span>{icons[type]}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {onDismiss && <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}>✕</button>}
    </div>
  );
}

// PKR Amount display
export function PKRAmount({ amount, size = 'normal', positive, negative }) {
  const colorClass = positive ? 'money-positive' : negative ? 'money-negative' : '';
  return (
    <span className={`money ${size === 'large' ? 'money-lg' : ''} ${colorClass}`}>
      {fmtPKR(amount)}
    </span>
  );
}

// Transaction row badge
export function TxnStatusBadge({ status }) {
  return <span className={`badge ${txnBadge(status)}`}>{status}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`badge ${statusBadge(status)}`}>{status}</span>;
}

// Stat card
export function StatCard({ icon, iconClass, value, label, delay = 0 }) {
  return (
    <div className={`stat-card fade-in-up-${delay}`}>
      <div className={`stat-icon ${iconClass || ''}`}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// Progress bar
export function ProgressBar({ value, max, type = 'safe' }) {
  const pct = Math.min(100, Math.round((value / (max || 1)) * 100));
  let cls = 'safe';
  if (pct >= 100) cls = 'exceeded';
  else if (pct >= 80) cls = 'near';
  return (
    <div>
      <div className="progress-bar">
        <div className={`progress-fill ${type === 'primary' ? 'primary' : cls}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex-between mt-4 text-xs text-muted">
        <span>{fmtPKR(value)}</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}

// Risk dot
export function RiskDot({ color }) {
  return <span className={`risk-dot ${color}`} />;
}

// Murabaha breakdown table
export function MurabahaBreakdown({ costPrice, profitMarkup, totalRepaymentAmount, markupRate, durationDays }) {
  return (
    <div className="murabaha-breakdown">
      <div className="murabaha-row">
        <span className="murabaha-row-label">Cost Price</span>
        <span className="murabaha-row-value">{fmtPKR(costPrice)}</span>
      </div>
      <div className="murabaha-row">
        <span className="murabaha-row-label">Profit Markup ({((markupRate || 0) * 100).toFixed(1)}% / {durationDays} days)</span>
        <span className="murabaha-row-value">{fmtPKR(profitMarkup)}</span>
      </div>
      <div className="murabaha-row total">
        <span className="murabaha-row-label">Total Repayment</span>
        <span className="murabaha-row-value">{fmtPKR(totalRepaymentAmount)}</span>
      </div>
    </div>
  );
}

// Inline spinner button
export function LoadingButton({ loading, children, className = '', ...props }) {
  return (
    <button {...props} className={`btn ${className}`} disabled={loading || props.disabled}>
      {loading ? <><span className="spinner spinner-sm" /> Processing...</> : children}
    </button>
  );
}

// Section header
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex-between mb-16">
      <div>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {subtitle && <div className="text-muted text-small mt-4">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// Transaction list item
export function TxnItem({ txn, userId }) {
  const isIncoming = txn.receiverId?._id === userId || txn.receiverId === userId;
  const isOutgoing = txn.senderId?._id === userId || txn.senderId === userId;
  const isDeposit = txn.type === 'deposit';
  const isWithdraw = txn.type === 'withdrawal';

  const positive = isIncoming || isDeposit;
  const negative = isOutgoing && !isDeposit;

  return (
    <div className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="flex gap-12 items-center">
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: positive ? 'var(--success-bg)' : 'var(--danger-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0
        }}>
          {positive ? '⬇' : '⬆'}
        </div>
        <div>
          <div style={{ fontSize: '0.86rem', fontWeight: 500 }}>{txnTypeLabel(txn.type)}</div>
          <div className="text-xs text-muted">{fmtDate(txn.createdAt)} · <span className="font-mono">{txn.transactionId}</span></div>
        </div>
      </div>
      <div className="text-right">
        <div className={`money ${positive ? 'money-positive' : 'money-negative'}`} style={{ fontSize: '0.9rem', fontWeight: 700 }}>
          {positive ? '+' : '-'}{fmtPKR(txn.amount)}
        </div>
        <TxnStatusBadge status={txn.status} />
      </div>
    </div>
  );
}
