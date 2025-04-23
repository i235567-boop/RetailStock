import { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { adminService } from '../../services/apiServices';
import { fmtPKR } from '../../utils/helpers';
import { LoadingState, StatCard } from '../../components/common';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminService.getDashboard(), adminService.getSystemReports()])
      .then(([d, r]) => { setData(d.data.data); setReports(r.data.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout title="Admin Dashboard"><LoadingState /></AppLayout>;

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const volData = (reports?.txnVolume || []).slice(-6);
  const barData = {
    labels: volData.map(v => MONTHS[(v._id.month || 1) - 1]),
    datasets: [{ label: 'Transaction Volume', data: volData.map(v => v.volume), backgroundColor: 'rgba(59,111,212,0.7)', borderRadius: 6 }],
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E2535', bodyColor: '#9BA8BE' } },
    scales: { x: { grid: { color: 'rgba(99,130,180,0.08)' }, ticks: { color: '#5C6B82' } }, y: { grid: { color: 'rgba(99,130,180,0.08)' }, ticks: { color: '#5C6B82', callback: v => `${(v/1000).toFixed(0)}k` } } },
  };

  return (
    <AppLayout title="Admin Dashboard">
      <div className="page-header fade-in-up">
        <div><h2>System Overview</h2><p className="page-subtitle">RetailStock platform analytics</p></div>
      </div>

      <div className="grid grid-4 mb-24">
        <StatCard icon="👥" value={data?.totalUsers || 0} label="Total Users" delay={1} />
        <StatCard icon="✅" iconClass="success" value={data?.activeUsers || 0} label="Active Users" delay={2} />
        <StatCard icon="🚫" iconClass="danger" value={data?.blockedUsers || 0} label="Blocked Users" delay={3} />
        <StatCard icon="🚩" iconClass="warning" value={data?.flaggedTransactions || 0} label="Flagged Transactions" delay={4} />
      </div>

      <div className="grid grid-4 mb-24">
        <StatCard icon="📋" value={data?.totalTransactions || 0} label="Total Transactions" delay={1} />
        <StatCard icon="💳" iconClass="cyan" value={fmtPKR(data?.transactionVolume)} label="Transaction Volume" delay={2} />
        <StatCard icon="🏦" iconClass="warning" value={data?.activeFinancing || 0} label="Active Financing" delay={3} />
        <StatCard icon="⚡" iconClass="success" value={fmtPKR(data?.totalFinancingValue)} label="Financing Portfolio" delay={4} />
      </div>

      <div className="grid grid-2">
        <div className="card fade-in-up-2">
          <div className="card-title mb-4">Transaction Volume</div>
          <div className="card-subtitle mb-16">Last 6 months</div>
          <div style={{ height: 220 }}>
            <Bar data={barData} options={chartOpts} />
          </div>
        </div>
        <div className="card fade-in-up-3">
          <div className="card-title mb-16">System Health</div>
          {[
            { label: 'Total System Balance', value: fmtPKR(reports?.totalSystemBalance), icon: '💰' },
            { label: 'Active Financing Value', value: fmtPKR(data?.totalFinancingValue), icon: '🏦' },
            { label: 'Transaction Volume', value: fmtPKR(data?.transactionVolume), icon: '📊' },
            { label: 'User Activation Rate', value: `${data?.totalUsers ? Math.round((data.activeUsers / data.totalUsers) * 100) : 0}%`, icon: '📈' },
          ].map(item => (
            <div key={item.label} className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex gap-10 items-center">
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
              <span className="money" style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
