import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const path = location.pathname;

  const userNav = [
    { icon: '🏠', label: 'Home', path: '/dashboard' },
    { icon: '🏦', label: 'Finance', path: '/financing' },
    { icon: '📋', label: 'History', path: '/transactions' },
    { icon: '🔔', label: 'Alerts', path: '/notifications' },
  ];
  const adminNav = [
    { icon: '📊', label: 'Dashboard', path: '/admin' },
    { icon: '👥', label: 'Users', path: '/admin/users' },
    { icon: '📋', label: 'Txns', path: '/admin/transactions' },
    { icon: '🚩', label: 'Flagged', path: '/admin/flagged' },
  ];
  const navItems = isAdmin ? adminNav : userNav;

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="topbar">
          <span className="topbar-title">{title || 'RetailStock'}</span>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
              🏠
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }}>
              Sign Out
            </button>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>

      <nav className="bottom-nav">
        {navItems.map(item => (
          <button
            key={item.path}
            className={`bottom-nav-item ${path === item.path || path.startsWith(item.path + '/') ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
