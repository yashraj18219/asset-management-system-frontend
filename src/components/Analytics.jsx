import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import api from '../api/axios';
import '../App.css';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      user?.role && ['MANAGER', 'ITTEAM', 'SUPERADMIN'].includes(user.role)
        ? api.get('/users')
        : Promise.resolve({ data: [] }),
      api.get('/assets'),
      api.get('/tickets')
    ])
      .then(([usersRes, assetsRes, ticketsRes]) => {
        setUsers(usersRes?.data || []);
        setAssets(assetsRes?.data || []);
        setTickets(ticketsRes?.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.role]);

  /* ================= BASIC BREAKDOWNS ================= */

  const userByRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const assetByType = assets.reduce((acc, a) => {
    acc[a.assetType] = (acc[a.assetType] || 0) + 1;
    return acc;
  }, {});

  const assetByStatus = assets.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const warrantyBreakdown = assets.reduce((acc, a) => {
    const expired = a.warrantyDate && new Date(a.warrantyDate) < today;
    acc[expired ? 'Out of Warranty' : 'In Warranty'] =
      (acc[expired ? 'Out of Warranty' : 'In Warranty'] || 0) + 1;
    return acc;
  }, {});

  const toChartData = (obj) =>
    Object.entries(obj).map(([name, value]) => ({ name, value }));

  /* ================= KPI CALCULATIONS ================= */

  const repairTickets = tickets.filter(
    t => t.requestType === 'REPAIR' && t.status === 'CONFIRMED'
  );

  const avgRepairTime =
    repairTickets.length > 0
      ? repairTickets.reduce((acc, t) =>
          acc + (new Date(t.updatedAt) - new Date(t.createdAt)), 0
        ) / repairTickets.length / (1000 * 60 * 60 * 24)
      : 0;

  const approvedTickets = tickets.filter(t => t.status !== 'PENDING');

  const avgApprovalTime =
    approvedTickets.length > 0
      ? approvedTickets.reduce((acc, t) =>
          acc + (new Date(t.updatedAt) - new Date(t.createdAt)), 0
        ) / approvedTickets.length / (1000 * 60 * 60)
      : 0;

  const deliveredTickets = tickets.filter(
    t => t.status === 'DELIVERED' || t.status === 'CONFIRMED'
  );

  const avgDeliveryTime =
    deliveredTickets.length > 0
      ? deliveredTickets.reduce((acc, t) =>
          acc + (new Date(t.updatedAt) - new Date(t.createdAt)), 0
        ) / deliveredTickets.length / (1000 * 60 * 60)
      : 0;

  /* ================= MONTHLY TREND ================= */

  const monthlyTrend = tickets.reduce((acc, t) => {
    if (!t.createdAt) return acc;
    const month = new Date(t.createdAt).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  /* ================= WEEKLY TREND ================= */

  const weeklyTrend = tickets.reduce((acc, t) => {
    if (!t.createdAt) return acc;
    const week = `Week ${Math.ceil(new Date(t.createdAt).getDate() / 7)}`;
    acc[week] = (acc[week] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <p className="loading">Loading analytics...</p>;

  return (
    <div className="card">
      <h2 style={styles.title}>Analytics</h2>

      {/* ================= KPI CARDS (TOP) ================= */}

      <div style={styles.kpiContainer}>
        <div style={styles.kpiCard}>
          <h4>Avg Repair Time</h4>
          <p>{avgRepairTime.toFixed(1)} days</p>
        </div>
        <div style={styles.kpiCard}>
          <h4>Avg Approval Time</h4>
          <p>{avgApprovalTime.toFixed(1)} hrs</p>
        </div>
        <div style={styles.kpiCard}>
          <h4>Avg Delivery Time</h4>
          <p>{avgDeliveryTime.toFixed(1)} hrs</p>
        </div>
      </div>

      {/* ================= YOUR ORIGINAL 4 CHARTS ================= */}

      <div style={styles.charts}>

        {users.length > 0 && (
          <div style={styles.chartBox}>
            <h3 style={styles.chartTitle}>Users by Role</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <Pie
                  data={toChartData(userByRole)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {toChartData(userByRole).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={styles.chartBox}>
          <h3 style={styles.chartTitle}>Assets by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
              <Pie
                data={toChartData(assetByType)}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {toChartData(assetByType).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartBox}>
          <h3 style={styles.chartTitle}>Warranty Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
              <Pie
                data={toChartData(warrantyBreakdown)}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {toChartData(warrantyBreakdown).map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.name === 'Out of Warranty' ? '#ef4444' : '#22c55e'}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartBox}>
          <h3 style={styles.chartTitle}>Assets by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
              <Pie
                data={toChartData(assetByStatus)}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {toChartData(assetByStatus).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ================= MONTHLY TREND ================= */}

      <div style={{ marginTop: '2rem' }}>
        <h3 style={styles.chartTitle}>Monthly Ticket Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={toChartData(monthlyTrend)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0ea5e9" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ================= WEEKLY TREND ================= */}

      <div style={{ marginTop: '2rem' }}>
        <h3 style={styles.chartTitle}>Weekly Ticket Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={toChartData(weeklyTrend)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#22c55e" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

const styles = {
  title: { marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' },
  charts: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' },
  chartBox: { background: '#f8fafc', borderRadius: '8px', padding: '1.25rem', border: '1px solid #e2e8f0', minHeight: 320 },
  chartTitle: { marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600, color: '#475569' },
  kpiContainer: { display: 'flex', gap: '1rem', marginBottom: '2rem' },
  kpiCard: { flex: 1, background: '#ffffff', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }
};