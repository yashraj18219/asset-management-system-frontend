import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UsersList from '../components/UsersList';
import AssetsList from '../components/AssetsList';
import TicketsList from '../components/TicketsList';
import Analytics from '../components/Analytics';
import '../App.css';

const TABS = [
  { id: 'users', label: 'Users', roles: ['MANAGER', 'ITTEAM', 'SUPERADMIN'] },
  { id: 'assets', label: 'Assets', roles: ['ITTEAM', 'SUPERADMIN'] },
  { id: 'tickets', label: 'Tickets', roles: ['USER', 'MANAGER', 'ITTEAM', 'SUPERADMIN'] },
  { id: 'analytics', label: 'Analytics', roles: ['ITTEAM', 'SUPERADMIN'] },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'analytics' : 'tickets');

  const visibleTabs = TABS.filter((t) => t.roles.includes(user?.role));

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>📦</span>
          <h1 style={styles.logo}>Asset Management</h1>
        </div>
        <div style={styles.userRow}>
          <span style={styles.userInfo}>
            <span style={styles.userName}>{user?.name}</span>
            <span style={styles.role}>{user?.role}</span>
          </span>
          <button onClick={logout} className="btn btn-danger" style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>
      <nav style={styles.nav}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main style={styles.main}>
        {activeTab === 'users' && <UsersList />}
        {activeTab === 'assets' && <AssetsList />}
        {activeTab === 'tickets' && <TicketsList />}
        {activeTab === 'analytics' && <Analytics />}
      </main>
    </div>
  );
}

const styles = {
  wrapper: { maxWidth: 1200, margin: '0 auto', minHeight: '100vh' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    background: 'white',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  logoIcon: { fontSize: '1.5rem' },
  logo: { fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' },
  userRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  userName: { fontWeight: 600, fontSize: '0.95rem' },
  role: { fontSize: '0.8rem', color: '#64748b' },
  logoutBtn: { padding: '0.5rem 1rem', fontSize: '0.9rem' },
  nav: {
    display: 'flex',
    gap: '0.25rem',
    padding: '0.75rem 1.5rem',
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
  },
  tab: {
    padding: '0.5rem 1.25rem',
    border: 'none',
    background: 'transparent',
    borderRadius: '8px',
    color: '#64748b',
    fontWeight: 500,
  },
  tabActive: { background: '#0ea5e9', color: 'white' },
  main: { padding: '1.5rem' },
};
