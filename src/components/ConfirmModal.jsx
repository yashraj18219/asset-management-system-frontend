import Modal from './Modal';
import '../App.css';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'primary' }) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p style={{ marginBottom: '1.25rem', color: '#64748b' }}>{message}</p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleConfirm}
          className={confirmVariant === 'danger' ? 'btn btn-danger' : 'btn'}
        >
          {confirmLabel}
        </button>
        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
      </div>
    </Modal>
  );
}
