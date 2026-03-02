import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import api from '../api/axios';
import Modal from './Modal';
import SortIcon from './SortIcon';
import '../App.css';

const ASSET_TYPES = ['monitor', 'laptop', 'printer', 'phone'];
const STATUSES = ['available', 'assigned', 'under-repair'];

export default function AssetsList() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetTypeFilter, setAssetTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const debouncedSearch = useDebounce(search, 300);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
  };

  const canManage = ['MANAGER', 'ITTEAM', 'SUPERADMIN'].includes(user?.role);
  const [showAdd, setShowAdd] = useState(false);
  const [newAsset, setNewAsset] = useState({ assetName: '', assetType: '', serialNumber: '', warrantyDate: '' });
  const [addError, setAddError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (assetTypeFilter) params.set('assetType', assetTypeFilter);
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/assets?${params}`)
      .then((res) => setAssets(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [assetTypeFilter, statusFilter]);

  const filtered = assets.filter((a) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return a.assetName?.toLowerCase().includes(q) || a.serialNumber?.toLowerCase().includes(q);
  });

  const sortedAssets = useMemo(() => {
    if (!sortBy) return filtered;
    return [...filtered].sort((a, b) => {
      let va = sortBy === 'assignedTo' ? (a.assignedTo?.name ?? '') : (a[sortBy] ?? '');
      let vb = sortBy === 'assignedTo' ? (b.assignedTo?.name ?? '') : (b[sortBy] ?? '');
      if (sortBy === 'warrantyDate') {
        va = new Date(va || 0).getTime();
        vb = new Date(vb || 0).getTime();
      } else if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortBy, sortDir]);

  const isWarrantyExpired = (warrantyDate) => {
    if (!warrantyDate) return false;
    return new Date(warrantyDate) < new Date();
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

  const getStatusClass = (s) => {
    const m = { available: 'badge-available', assigned: 'badge-assigned', 'under-repair': 'badge-repair' };
    return m[s] || '';
  };

  const handleAddAsset = async () => {
    setAddError('');
    try {
      await api.post('/assets', newAsset);
      setNewAsset({ assetName: '', assetType: '', serialNumber: '', warrantyDate: '' });
      setShowAdd(false);
      const params = new URLSearchParams();
      if (assetTypeFilter) params.set('assetType', assetTypeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/assets?${params}`);
      setAssets(res.data);
    } catch (err) {
      setAddError(String(err));
    }
  };

  return (
    <div className="card">
      <div style={styles.header}>
        <h2 style={styles.title}>Assets</h2>
        {canManage && (
          <button onClick={() => setShowAdd(true)} className="btn">
            + Add Asset
          </button>
        )}
      </div>
      <Modal open={showAdd && canManage} onClose={() => { setShowAdd(false); setAddError(''); }} title="Add Asset">
        <div style={styles.form}>
          <input
            placeholder="Asset name"
            value={newAsset.assetName}
            onChange={(e) => setNewAsset((a) => ({ ...a, assetName: e.target.value }))}
            className="input"
            style={styles.formInput}
          />
          <select
            value={newAsset.assetType}
            onChange={(e) => setNewAsset((a) => ({ ...a, assetType: e.target.value }))}
            style={styles.select}
          >
            <option value="">Type</option>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            placeholder="Serial number"
            value={newAsset.serialNumber}
            onChange={(e) => setNewAsset((a) => ({ ...a, serialNumber: e.target.value }))}
            className="input"
            style={styles.formInput}
          />
          <input
            type="date"
            value={newAsset.warrantyDate}
            onChange={(e) => setNewAsset((a) => ({ ...a, warrantyDate: e.target.value }))}
            className="input"
            style={styles.formInput}
          />
          {addError && <p style={styles.error}>{addError}</p>}
          <div style={styles.formActions}>
            <button onClick={handleAddAsset} className="btn">Save</button>
            <button onClick={() => { setShowAdd(false); setAddError(''); }} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by name or serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={styles.search}
        />
        <select value={assetTypeFilter} onChange={(e) => setAssetTypeFilter(e.target.value)} style={styles.select}>
          <option value="">All types</option>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="loading">Loading assets...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th className="sortable-th" onClick={() => handleSort('assetName')}>Name <SortIcon direction={sortBy === 'assetName' ? sortDir : null} /></th>
              <th className="sortable-th" onClick={() => handleSort('assetType')}>Type <SortIcon direction={sortBy === 'assetType' ? sortDir : null} /></th>
              <th className="sortable-th" onClick={() => handleSort('serialNumber')}>Serial <SortIcon direction={sortBy === 'serialNumber' ? sortDir : null} /></th>
              <th className="sortable-th" onClick={() => handleSort('warrantyDate')}>Warranty <SortIcon direction={sortBy === 'warrantyDate' ? sortDir : null} /></th>
              <th className="sortable-th" onClick={() => handleSort('status')}>Status <SortIcon direction={sortBy === 'status' ? sortDir : null} /></th>
              <th className="sortable-th" onClick={() => handleSort('assignedTo')}>Assigned To <SortIcon direction={sortBy === 'assignedTo' ? sortDir : null} /></th>
            </tr>
          </thead>
          <tbody>
            {sortedAssets.map((a) => (
              <tr key={a._id} style={isWarrantyExpired(a.warrantyDate) ? styles.expiredRow : {}}>
                <td style={styles.name}>{a.assetName}</td>
                <td>{a.assetType}</td>
                <td style={styles.serial}>{a.serialNumber}</td>
                <td>{formatDate(a.warrantyDate)}</td>
                <td>
                  <span className={`badge ${getStatusClass(a.status)}`}>{a.status}</span>
                </td>
                <td>{a.assignedTo?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: 0 },
  filters: { display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  search: { flex: 1, minWidth: 180 },
  select: { padding: '0.6rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', minWidth: 120 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formInput: { minWidth: 140 },
  formActions: { display: 'flex', gap: '0.5rem' },
  error: { color: '#ef4444', fontSize: '0.875rem', width: '100%' },
  name: { fontWeight: 500 },
  serial: { fontFamily: 'monospace', fontSize: '0.9rem' },
  expiredRow: { backgroundColor: 'rgba(254, 202, 202, 0.4)' },
};
