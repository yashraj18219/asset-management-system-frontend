import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import '../App.css';

const ASSET_TYPES = ['monitor', 'laptop', 'printer', 'phone'];

export default function TicketsList() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newAssetType, setNewAssetType] = useState('');
  const [repairAssetId, setRepairAssetId] = useState('');
  const [returnAssetId, setReturnAssetId] = useState('');
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);

  const isUser = user?.role === 'USER';
  const isManager = user?.role === 'MANAGER';
  const isIT = user?.role === 'ITTEAM';

  const assignedAssets = assets.filter((a) => a.assignedTo?._id === user?.id || a.assignedTo === user?.id);

  useEffect(() => {
    setLoading(true);
    const params = user?.role === 'USER' ? `?userId=${user.id}` : '';
    api.get(`/tickets${params}`)
      .then((res) => setTickets(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
    if (isUser) api.get('/assets').then((res) => setAssets(res.data));
  }, [user?.id, user?.role]);

  const refetch = () => {
    const params = user?.role === 'USER' ? `?userId=${user.id}` : '';
    api.get(`/tickets${params}`).then((res) => setTickets(res.data));
  };

  const pendingTickets = tickets.filter((t) => t.status === 'PENDING');
  const approvedTickets = tickets.filter((t) => t.status === 'APPROVED');
  const myDeliveredTickets = tickets.filter(
    (t) => t.status === 'DELIVERED' && (t.userId?._id === user?.id || t.userId === user?.id)
  );

  const createTicket = async (payload) => {
    setError('');
    try {
      await api.post('/tickets', payload);
      setShowNewModal(false);
      setNewAssetType('');
      setRepairAssetId('');
      setReturnAssetId('');
      refetch();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleNewRequest = () => {
    if (!newAssetType) return setError('Select asset type');
    createTicket({ requestType: 'NEW', assetType: newAssetType });
  };

  const handleRepairRequest = () => {
    if (!repairAssetId) return setError('Select an asset');
    const asset = assignedAssets.find((a) => a._id === repairAssetId);
    setConfirmModal({
      title: 'Repair Request',
      message: `Request repair for ${asset?.assetName || 'this asset'}?`,
      onConfirm: () => createTicket({ requestType: 'REPAIR', assetId: repairAssetId }),
      confirmLabel: 'Request Repair',
    });
  };

  const handleReturnRequest = () => {
    if (!returnAssetId) return setError('Select an asset');
    const asset = assignedAssets.find((a) => a._id === returnAssetId);
    setConfirmModal({
      title: 'Return Request',
      message: `Request to return ${asset?.assetName || 'this asset'}?`,
      onConfirm: () => createTicket({ requestType: 'RETURN', assetId: returnAssetId }),
      confirmLabel: 'Request Return',
    });
  };

  const approve = async (id) => {
    try {
      await api.post(`/tickets/${id}/approve`);
      refetch();
    } catch (err) {
      alert(err);
    }
  };

  const reject = async (id) => {
    try {
      await api.post(`/tickets/${id}/reject`);
      refetch();
    } catch (err) {
      alert(err);
    }
  };

  const deliver = async (id) => {
    try {
      await api.post(`/tickets/${id}/deliver`);
      refetch();
    } catch (err) {
      alert(err);
    }
  };

  const confirmReceipt = async (id) => {
    try {
      await api.post(`/tickets/${id}/confirm`);
      refetch();
    } catch (err) {
      alert(err);
    }
  };

  const openConfirm = (action, ticketOrId) => {
    const id = typeof ticketOrId === 'string' ? ticketOrId : ticketOrId?._id;
    const ticket = typeof ticketOrId === 'object' ? ticketOrId : null;
    const requestType = ticket?.requestType || '';

    const deliverLabel = requestType === 'REPAIR' ? 'Mark Repaired' : requestType === 'RETURN' ? 'Mark Returned' : 'Mark Delivered';
    const deliverMsg = requestType === 'REPAIR'
      ? 'Confirm that this asset has been repaired and returned to the user?'
      : requestType === 'RETURN'
        ? 'Confirm that this asset has been returned?'
        : 'Confirm that this asset has been delivered to the user?';

    const configs = {
      approve: { title: 'Approve Ticket', message: 'Are you sure you want to approve this request?', onConfirm: () => approve(id) },
      reject: { title: 'Reject Ticket', message: 'Are you sure you want to reject this request?', onConfirm: () => reject(id), confirmLabel: 'Reject', confirmVariant: 'danger' },
      deliver: { title: deliverLabel, message: deliverMsg, onConfirm: () => deliver(id), confirmLabel: 'Yes, ' + (requestType === 'REPAIR' ? 'Repaired' : requestType === 'RETURN' ? 'Returned' : 'Delivered') },
      confirm: { title: 'Confirm Receipt', message: 'Confirm that you have received this asset?', onConfirm: () => confirmReceipt(id), confirmLabel: 'Yes, Received' },
    };
    setConfirmModal(configs[action]);
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');
  const getStatusClass = (s) => {
    const m = { PENDING: 'badge-pending', APPROVED: 'badge-approved', DELIVERED: 'badge-delivered', CONFIRMED: 'badge-confirmed', REJECTED: 'badge-rejected' };
    return m[s] || 'badge-pending';
  };

  return (
    <div className="card">
      <h2 style={styles.title}>Tickets</h2>

      {isUser && (
        <>
          <div style={styles.actions}>
            <button onClick={() => setShowNewModal(true)} className="btn">+ New Asset Request</button>
            {assignedAssets.length > 0 && (
              <>
                <select value={repairAssetId} onChange={(e) => setRepairAssetId(e.target.value)} style={styles.select}>
                  <option value="">Select for repair</option>
                  {assignedAssets.map((a) => (
                    <option key={a._id} value={a._id}>{a.assetName} ({a.assetType})</option>
                  ))}
                </select>
                <button onClick={handleRepairRequest} disabled={!repairAssetId} className="btn btn-secondary">Repair</button>
                <select value={returnAssetId} onChange={(e) => setReturnAssetId(e.target.value)} style={styles.select}>
                  <option value="">Select to return</option>
                  {assignedAssets.map((a) => (
                    <option key={a._id} value={a._id}>{a.assetName} ({a.assetType})</option>
                  ))}
                </select>
                <button onClick={handleReturnRequest} disabled={!returnAssetId} className="btn btn-secondary">Return</button>
              </>
            )}
          </div>
          <Modal open={showNewModal} onClose={() => { setShowNewModal(false); setError(''); }} title="New Asset Request">
            <select value={newAssetType} onChange={(e) => setNewAssetType(e.target.value)} className="input" style={{ marginBottom: '0.75rem' }}>
              <option value="">Select asset type</option>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {error && <p style={styles.error}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={handleNewRequest} className="btn">Submit</button>
              <button onClick={() => { setShowNewModal(false); setError(''); }} className="btn btn-secondary">Cancel</button>
            </div>
          </Modal>
        </>
      )}

      {isManager && pendingTickets.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Pending Approval</h3>
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Asset</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingTickets.map((t) => (
                <tr key={t._id}>
                  <td>{t.userId?.name}</td>
                  <td>{t.requestType}</td>
                  <td>{t.assetId?.assetName || t.assetType || '—'}</td>
                  <td>{formatDate(t.createdAt)}</td>
                  <td>
                    <button onClick={() => openConfirm('approve', t)} className="btn" style={styles.btnSm}>Approve</button>
                    <button onClick={() => openConfirm('reject', t)} className="btn btn-danger" style={styles.btnSm}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {isIT && approvedTickets.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Approved — Mark Delivered / Repaired / Returned</h3>
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Asset</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvedTickets.map((t) => (
                <tr key={t._id}>
                  <td>{t.userId?.name} <span style={styles.email}>({t.userId?.email})</span></td>
                  <td>{t.requestType}</td>
                  <td>{t.assetId?.assetName || t.assetType || '—'}</td>
                  <td>
                    <button onClick={() => openConfirm('deliver', t)} className="btn">
                      {t.requestType === 'REPAIR' ? 'Mark Repaired' : t.requestType === 'RETURN' ? 'Mark Returned' : 'Mark Delivered'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {isUser && myDeliveredTickets.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Awaiting Your Confirmation</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Asset</th>
                <th>Delivered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myDeliveredTickets.map((t) => (
                <tr key={t._id}>
                  <td>{t.requestType}</td>
                  <td>{t.assetId?.assetName || t.assetType || '—'}</td>
                  <td>{formatDate(t.updatedAt)}</td>
                  <td>
                    <button onClick={() => openConfirm('confirm', t)} className="btn">Confirm Receipt</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>All Tickets</h3>
        {loading ? (
          <p className="loading">Loading tickets...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Asset</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id}>
                  <td>{t.userId?.name}</td>
                  <td>{t.requestType}</td>
                  <td>{t.assetId?.assetName || t.assetType || '—'}</td>
                  <td>
                    <span className={`badge ${getStatusClass(t.status)}`}>{t.status}</span>
                  </td>
                  <td>{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {confirmModal && (
        <ConfirmModal
          open={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          confirmVariant={confirmModal.confirmVariant}
        />
      )}
    </div>
  );
}

const styles = {
  title: { marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' },
  actions: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' },
  select: { padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', minWidth: 160 },
  error: { color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' },
  section: { marginTop: '1.75rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' },
  btnSm: { padding: '0.35rem 0.65rem', fontSize: '0.85rem', marginRight: '0.35rem' },
  email: { color: '#64748b', fontSize: '0.85rem' },
};
