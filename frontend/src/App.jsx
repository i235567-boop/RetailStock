import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './routes/ProtectedRoute';
import './styles/global.css';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/user/Dashboard';
import Wallet from './pages/user/Wallet';
import Transactions from './pages/user/Transactions';
import TransactionDetail from './pages/user/TransactionDetail';
import { FinancingList, FinancingApply, RepaymentPage } from './pages/financing/index';
import Expenses from './pages/user/Expenses';
import Budgets from './pages/user/Budgets';
import Reports from './pages/user/Reports';
import Notifications from './pages/user/Notifications';
import Profile from './pages/user/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import { AdminUsers, AdminWallets, AdminTransactions, AdminFlagged, AdminFinancing, AdminCategories, AdminAuditLogs } from './pages/admin/index';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* User */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/transactions/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />
          <Route path="/financing" element={<ProtectedRoute><FinancingList /></ProtectedRoute>} />
          <Route path="/financing/apply" element={<ProtectedRoute><FinancingApply /></ProtectedRoute>} />
          <Route path="/financing/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />
          <Route path="/financing/:id/repay" element={<ProtectedRoute><RepaymentPage /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/wallets" element={<AdminRoute><AdminWallets /></AdminRoute>} />
          <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
          <Route path="/admin/flagged" element={<AdminRoute><AdminFlagged /></AdminRoute>} />
          <Route path="/admin/financing" element={<AdminRoute><AdminFinancing /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
          <Route path="/admin/audit" element={<AdminRoute><AdminAuditLogs /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
