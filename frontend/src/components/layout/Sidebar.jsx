import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import { useState, useEffect } from 'react';
import { notifService } from '../../services/apiServices';

import {
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  Flag,
  Landmark,
  Tags,
  FileText,
  Home,
  CreditCard,
  Zap,
  BarChart3,
  LineChart,
  Bell,
  User,
} from "lucide-react";

/* NAV ITEM */
const NavItem = ({ to, icon: Icon, label, badge, collapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    data-label={label}
  >
    <span className="nav-item-icon">
      {Icon && <Icon size={18} strokeWidth={2} />}
    </span>

    {!collapsed && (
      <>
        <span className="nav-item-label">{label}</span>
        {badge > 0 && <span className="nav-item-badge">{badge}</span>}
      </>
    )}
  </NavLink>
);

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    notifService
      .list({ limit: 1 })
      .then(r => setUnread(r.data.data.unreadCount || 0))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

      {/* LOGO + TOGGLE */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">RS</div>

        {!collapsed && (
          <div className="sidebar-logo-text-wrap">
            <div className="sidebar-logo-text">RetailStock</div>
            <div className="sidebar-logo-sub">
              Inventory Financing Platform
            </div>
          </div>
        )}

        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          ☰
        </button>
      </div>

      {/* NAV */}
      <nav className="sidebar-nav">

        {isAdmin ? (
          <>
            <span className="sidebar-section-label">Overview</span>
            <NavItem
              to="/admin"
              icon={LayoutDashboard}
              label="Dashboard"
              collapsed={collapsed}
            />

            <span className="sidebar-section-label">Management</span>
            <NavItem to="/admin/users" icon={Users} label="Users" collapsed={collapsed} />
            <NavItem to="/admin/wallets" icon={Wallet} label="Wallets" collapsed={collapsed} />
            <NavItem to="/admin/transactions" icon={Receipt} label="Transactions" collapsed={collapsed} />
            <NavItem to="/admin/flagged" icon={Flag} label="Flagged" collapsed={collapsed} />
            <NavItem to="/admin/financing" icon={Landmark} label="Financing Portfolio" collapsed={collapsed} />

            <span className="sidebar-section-label">Config</span>
            <NavItem to="/admin/categories" icon={Tags} label="Categories" collapsed={collapsed} />
            <NavItem to="/admin/audit" icon={FileText} label="Audit Logs" collapsed={collapsed} />
          </>
        ) : (
          <>
            <span className="sidebar-section-label">Overview</span>

            <div className="sidebar-group">
              <NavItem to="/dashboard" icon={Home} label="Dashboard" collapsed={collapsed} />
              <NavItem to="/wallet" icon={CreditCard} label="Wallet" collapsed={collapsed} />
            </div>

            <span className="sidebar-section-label">Financing</span>

            <div className="sidebar-group">
              <NavItem to="/financing" icon={Landmark} label="My Financing" collapsed={collapsed} />
              <NavItem to="/financing/apply" icon={Zap} label="Apply Now" collapsed={collapsed} />
            </div>

            <div className="sidebar-group">
              <span className="sidebar-section-label">Finance</span>

              <NavItem to="/transactions" icon={Receipt} label="Transactions" collapsed={collapsed} />
              <NavItem to="/expenses" icon={Wallet} label="Expenses" collapsed={collapsed} />
              <NavItem to="/budgets" icon={BarChart3} label="Budgets" collapsed={collapsed} />
              <NavItem to="/reports" icon={LineChart} label="Reports" collapsed={collapsed} />
            </div>

            <span className="sidebar-section-label">Account</span>

            <div className="sidebar-group">
              <NavItem
                to="/notifications"
                icon={Bell}
                label="Notifications"
                badge={unread}
                collapsed={collapsed}
              />
              <NavItem to="/profile" icon={User} label="Profile" collapsed={collapsed} />
            </div>
          </>
        )}
      </nav>

      {/* FOOTER */}
      {/* FOOTER */}
<div className="sidebar-footer">
  <div
    className="sidebar-user"
    onClick={handleLogout}
    title="Click to logout"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
      background: 'var(--bg-elevated)',
      cursor: 'pointer',
      transition: 'background 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
  >
    <div
      className="sidebar-user-avatar"
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'var(--primary)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.82rem',
        flexShrink: 0,
      }}
    >
      {getInitials(user?.name)}
    </div>

    {!collapsed && (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="sidebar-user-name truncate"
          style={{
            maxWidth: 140,
            fontWeight: 600,
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {user?.name}
        </div>
        <div
          className="sidebar-user-role"
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 2,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--success)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          {user?.role} · Logout
        </div>
      </div>
    )}
  </div>
</div>
    </aside>
  );
}