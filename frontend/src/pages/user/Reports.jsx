import { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { reportService } from '../../services/apiServices';
import { fmtPKR } from '../../utils/helpers';
import { LoadingState } from '../../components/common';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#9BA8BE', font: { size: 11 } } }, tooltip: { backgroundColor: '#1E2535', titleColor: '#E8EDF5', bodyColor: '#9BA8BE', borderColor: 'rgba(99,130,180,0.2)', borderWidth: 1 } },
  scales: { x: { grid: { color: 'rgba(99,130,180,0.08)' }, ticks: { color: '#5C6B82', font: { size: 11 } } }, y: { grid: { color: 'rgba(99,130,180,0.08)' }, ticks: { color: '#5C6B82', font: { size: 11 }, callback: v => `${(v/1000).toFixed(0)}k` } } },
};

export default function Reports() {
  const [dash, setDash] = useState(null);
  const [incomeExp, setIncomeExp] = useState(null);
  const [budgetUsage, setBudgetUsage] = useState(null);
  const [financing, setFinancing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportService.getDashboard(),
      reportService.getIncomeExpense(),
      reportService.getBudgetUsage(),
      reportService.getFinancingHistory(),
    ]).then(([d, ie, b, f]) => {
      setDash(d.data.data);
      setIncomeExp(ie.data.data);
      setBudgetUsage(b.data.data);
      setFinancing(f.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout title="Reports"><LoadingState /></AppLayout>;

  // Build monthly income/expense chart
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const ieMap = {};
  (incomeExp?.txnData || []).forEach(d => {
    const key = `${d._id.year}-${String(d._id.month).padStart(2,'0')}`;
    if (!ieMap[key]) ieMap[key] = { income: 0, expense: 0 };
    if (['deposit','financing_settlement'].includes(d._id.type)) ieMap[key].income += d.total;
    else if (['withdrawal','transfer','repayment'].includes(d._id.type)) ieMap[key].expense += d.total;
  });
  const ieLabels = Object.keys(ieMap).slice(-6).map(k => { const [y, m] = k.split('-'); return MONTHS[parseInt(m) - 1]; });
  const ieValues = Object.values(ieMap).slice(-6);

  const barData = {
    labels: ieLabels,
    datasets: [
      { label: 'Income', data: ieValues.map(v => v.income), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
      { label: 'Expenses', data: ieValues.map(v => v.expense), backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 },
    ],
  };

  // Budget doughnut
  const catSpend = budgetUsage?.categorySpending || [];
  const doughnutData = {
    labels: catSpend.slice(0, 6).map(c => c._id),
    datasets: [{ data: catSpend.slice(0, 6).map(c => c.total), backgroundColor: ['#3B6FD4','#00C2CC','#10B981','#F59E0B','#EF4444','#6366F1'], borderWidth: 0, hoverOffset: 6 }],
  };

  // Financing line
  const finRecords = (financing?.records || []).slice(0, 8).reverse();
  const finData = {
    labels: finRecords.map((_, i) => `Fin ${i + 1}`),
    datasets: [{
      label: 'Financing Amount',
      data: finRecords.map(r => r.costPrice),
      borderColor: '#5B8FF9', backgroundColor: 'rgba(59,111,212,0.08)',
      borderWidth: 2.5, pointBackgroundColor: '#5B8FF9', pointRadius: 4, tension: 0.4, fill: true,
    }],
  };

  return (
    <AppLayout title="Reports & Analytics">
      <div className="page-header fade-in-up">
        <div><h2>Reports & Analytics</h2><p className="page-subtitle">Insights into your financial activity</p></div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-4 mb-24 fade-in-up-1">
        {[
          { icon: '💳', cls: '', value: fmtPKR(dash?.wallet?.balance), label: 'Wallet Balance' },
          { icon: '⚡', cls: 'cyan', value: fmtPKR(dash?.availableCredit), label: 'Available Credit' },
          { icon: '🏦', cls: 'warning', value: dash?.activeFinancingCount || 0, label: 'Active Financing' },
          { icon: '🧾', cls: 'danger', value: fmtPKR(dash?.monthlyExpenses), label: 'Monthly Expenses' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2 mb-24">
        {/* Income vs Expense */}
        <div className="card fade-in-up-2">
          <div className="card-title mb-4">Income vs Expenses</div>
          <div className="card-subtitle mb-16">Last 6 months</div>
          <div style={{ height: 220 }}>
            <Bar data={barData} options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, legend: { position: 'top', labels: { color: '#9BA8BE', boxWidth: 12 } } } }} />
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card fade-in-up-3">
          <div className="card-title mb-4">Expense Categories</div>
          <div className="card-subtitle mb-16">This month breakdown</div>
          {catSpend.length ? (
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ height: 180, flex: '0 0 180px' }}>
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E2535', bodyColor: '#9BA8BE' } }, cutout: '68%' }} />
              </div>
              <div style={{ flex: 1 }}>
                {catSpend.slice(0, 6).map((c, i) => (
                  <div key={c._id} className="flex-between" style={{ marginBottom: 8 }}>
                    <div className="flex gap-8 items-center">
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: ['#3B6FD4','#00C2CC','#10B981','#F59E0B','#EF4444','#6366F1'][i], flexShrink: 0 }} />
                      <span className="text-small">{c._id}</span>
                    </div>
                    <span className="money text-small">{fmtPKR(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="empty-state" style={{ padding: 30 }}><div className="empty-state-icon">📊</div><div className="empty-state-text">No expense data yet</div></div>}
        </div>
      </div>

      {/* Financing history chart */}
      {finRecords.length > 0 && (
        <div className="card fade-in-up-4">
          <div className="card-title mb-4">Financing History</div>
          <div className="card-subtitle mb-16">Recent Murabaha financing amounts</div>
          <div style={{ height: 200 }}>
            <Line data={finData} options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, legend: { display: false } } }} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
