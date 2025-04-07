export const fmtPKR = (n) => {
  if (n === null || n === undefined) return 'PKR 0';
  return `PKR ${Number(n).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
};

export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const fmtRelative = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return fmtDate(d);
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

export const txnBadge = (status) => {
  const map = {
    successful: 'badge-success',
    failed: 'badge-danger',
    pending: 'badge-warning',
    flagged: 'badge-flagged',
  };
  return map[status] || 'badge-neutral';
};

export const txnTypeLabel = (type) => {
  const map = {
    deposit: '⬇ Deposit',
    withdrawal: '⬆ Withdrawal',
    transfer: '↔ Transfer',
    financing_settlement: '💰 Financing',
    repayment: '✓ Repayment',
    refund: '↩ Refund',
    fee: '⚡ Fee',
    bill_payment: '📄 Bill',
  };
  return map[type] || type;
};

export const statusBadge = (status) => {
  const map = {
    active: 'badge-success',
    blocked: 'badge-danger',
    suspended: 'badge-warning',
    pending: 'badge-neutral',
    completed: 'badge-success',
    defaulted: 'badge-danger',
    cancelled: 'badge-neutral',
    safe: 'badge-success',
    nearLimit: 'badge-warning',
    exceeded: 'badge-danger',
    verified: 'badge-success',
    failed: 'badge-danger',
    under_review: 'badge-info',
  };
  return map[status] || 'badge-neutral';
};

export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getApiError = (err) =>
  err?.response?.data?.message || err?.message || 'An error occurred. Please try again.';
