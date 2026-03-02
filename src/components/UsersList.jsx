import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import api from '../api/axios';
import SortIcon from './SortIcon';
import '../App.css';

export default function UsersList() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const debouncedSearch = useDebounce(search, 300);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
  };

  const sortedUsers = useMemo(() => {
    if (!sortBy) return users;
    return [...users].sort((a, b) => {
      let va = a[sortBy] ?? '';
      let vb = b[sortBy] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, sortBy, sortDir]);

  const isSuperAdmin = user?.role === 'SUPERADMIN';

  useEffect(() => {
    const params = new URLSearchParams();
    if (roleFilter) params.set('role', roleFilter);
    if (debouncedSearch) params.set('search', debouncedSearch);
    api.get(`/users?${params}`)
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [roleFilter, debouncedSearch]);

  const updateRole = async (userId, role) => {
    try {
      await api.patch(`/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role } : u)));
    } catch (err) {
      alert(err);
    }
  };

  const getRoleClass = (role) => {
    const m = { MANAGER: 'badge-approved', ITTEAM: 'badge-delivered', SUPERADMIN: 'badge-rejected', USER: 'badge-pending' };
    return m[role] || 'badge-pending';
  };

  if (!['MANAGER', 'ITTEAM', 'SUPERADMIN'].includes(user?.role)) return null;

  return (
    <div className="card">
      <h2 style={styles.title}>Users</h2>
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={styles.search}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={styles.select}
        >
          <option value="">All roles</option>
          <option value="USER">USER</option>
          <option value="MANAGER">MANAGER</option>
          <option value="ITTEAM">IT TEAM</option>
          <option value="SUPERADMIN">SUPERADMIN</option>
        </select>
      </div>
      {loading ? (
        <p className="loading">Loading users...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th className="sortable-th" onClick={() => handleSort('name')}>Name <SortIcon direction={sortBy === 'name' ? sortDir : null} /></th>
              <th className="sortable-th" onClick={() => handleSort('email')}>Email <SortIcon direction={sortBy === 'email' ? sortDir : null} /></th>
              <th className="sortable-th" onClick={() => handleSort('role')}>Role <SortIcon direction={sortBy === 'role' ? sortDir : null} /></th>
              {isSuperAdmin && <th>Change Role</th>}
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => (
              <tr key={u._id}>
                <td style={styles.name}>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${getRoleClass(u.role)}`}>{u.role}</span>
                </td>
                {isSuperAdmin && (
                  <td>
                    {u.role !== 'SUPERADMIN' && (
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u._id, e.target.value)}
                        style={styles.roleSelect}
                      >
                        <option value="USER">USER</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="ITTEAM">IT TEAM</option>
                      </select>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  title: { marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' },
  filters: { display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  search: { flex: 1, minWidth: 200 },
  select: {
    padding: '0.6rem 1rem',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    minWidth: 140,
  },
  name: { fontWeight: 500 },
  roleSelect: { padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' },
};
