import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { reportService } from '../../services/apiServices';
import { useAuth } from '../../context/AuthContext';
import { fmtPKR, fmtDate, fmtRelative, txnTypeLabel, txnBadge } from '../../utils/helpers';
import { StatCard, LoadingState, ProgressBar, Alert } from '../../components/common';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    reportService.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout title="Dashboard"><LoadingState /></AppLayout>;

  const chartLabels = ['Jan','Feb','Mar','Apr','May','Jun'];
  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Balance Trend',
      data: [20000, 35000, 28000, 42000, 38000, data?.wallet?.balance || 0],
      borderColor: '#3B6FD4',
      backgroundColor: 'rgba(59,111,212,0.08)',
      borderWidth: 2.5,
      pointBackgroundColor: '#5B8FF9',
      pointRadius: 4,
      tension: 0.4,
      fill: true,
    }],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E2535', titleColor: '#E8EDF5', bodyColor: '#9BA8BE', borderColor: 'rgba(99,130,180,0.2)', borderWidth: 1 } },
    scales: {
      x: { grid: { color: 'rgba(99,130,180,0.08)' }, ticks: { color: '#5C6B82', font: { size: 11 } } },
      y: { grid: { color: 'rgba(99,130,180,0.08)' }, ticks: { color: '#5C6B82', font: { size: 11 }, callback: v => `PKR ${(v/1000).toFixed(0)}k` } },
    },
  };

  const creditPct = Math.round(((user?.totalCreditLimit - user?.availableCredit) / (user?.totalCreditLimit || 1)) * 100);

  return (
    <AppLayout title="Dashboard">
      {error && <Alert type="error">{error}</Alert>}

      {/* Welcome */}
      <div className="page-header fade-in-up">
        <div>
          <h2>Good day, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="page-subtitle">{user?.businessName} · {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/financing/apply')}>⚡ Apply Financing</button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-4 mb-24">
        <StatCard icon="💳" iconClass="" value={fmtPKR(data?.wallet?.balance)} label="Wallet Balance" delay={1} />
        <StatCard icon="⚡" iconClass="cyan" value={fmtPKR(user?.availableCredit)} label="Available Credit" delay={2} />
        <StatCard icon="🏦" iconClass="warning" value={data?.activeFinancingCount || 0} label="Active Financing" delay={3} />
        <StatCard icon="📅" iconClass="danger" value={data?.nextDueDate ? fmtDate(data.nextDueDate) : '—'} label="Next Due Date" delay={4} />
      </div>

      <div className="grid grid-2 mb-24">
        {/* Chart */}
        <div className="card fade-in-up-1">
          <div className="flex-between mb-16">
            <div><div className="card-title">Wallet Balance Trend</div><div className="card-subtitle">Last 6 months</div></div>
          </div>
          <div style={{ height: 200 }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Credit usage */}
        <div className="card fade-in-up-2">
          <div className="card-title mb-8">Credit Utilisation</div>
          <div className="card-subtitle mb-16">Murabaha financing limit</div>
          <div className="wallet-card" style={{ padding: '20px 22px', marginBottom: 16 }}>
            <div className="wallet-balance-label">Available Credit</div>
            <div className="wallet-balance"><span className="pkr-unit">PKR</span>{(user?.availableCredit || 0).toLocaleString()}</div>
            <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>of {fmtPKR(user?.totalCreditLimit)} total</div>
          </div>
          <ProgressBar value={user?.totalCreditLimit - user?.availableCredit} max={user?.totalCreditLimit} />
          <div className="text-xs text-muted mt-8 text-center">{creditPct}% utilized · {fmtPKR(user?.availableCredit)} available</div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card fade-in-up-3">
        <div className="flex-between mb-16">
          <div className="card-title">Recent Transactions</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/transactions')}>View all →</button>
        </div>
        {!data?.recentTransactions?.length ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No transactions yet</div>
            <div className="empty-state-text">Your transaction history will appear here.</div>
          </div>
        ) : data.recentTransactions.map(t => (
          <div key={t._id} className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            onClick={() => navigate(`/transactions/${t._id}`)}>
            <div className="flex gap-12 items-center">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: ['deposit','financing_settlement','repayment'].includes(t.type) ? 'var(--success-bg)' : 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                {['deposit','financing_settlement'].includes(t.type) ? '⬇' : '⬆'}
              </div>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 500 }}>{txnTypeLabel(t.type)}</div>
                <div className="text-xs text-muted">{fmtRelative(t.createdAt)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="money" style={{ fontSize: '0.9rem', fontWeight: 700 }}>{fmtPKR(t.amount)}</div>
              <span className={`badge ${txnBadge(t.status)}`}>{t.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-4 mt-24 fade-in-up-4">
        {[
          { icon: '⬇', label: 'Deposit', path: '/wallet', color: 'var(--success-bg)' },
          { icon: '⬆', label: 'Withdraw', path: '/wallet', color: 'var(--danger-bg)' },
          { icon: '↔', label: 'Transfer', path: '/wallet', color: 'var(--info-bg)' },
          { icon: '⚡', label: 'Get Financing', path: '/financing/apply', color: 'var(--primary-glow)' },
        ].map(a => (
          <div key={a.label} className="card card-sm" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => navigate(a.path)}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', margin: '0 auto 10px' }}>{a.icon}</div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{a.label}</div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
