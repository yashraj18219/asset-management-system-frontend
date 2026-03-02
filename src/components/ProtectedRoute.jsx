import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div style={{
        minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '0.5rem', color: '#64748b', padding: '2rem',
      }}>
        <p style={{ fontWeight: 600, color: '#475569' }}>Access denied</p>
        <p style={{ fontSize: '0.9rem' }}>You don't have permission to view this page.</p>
      </div>
    );
  }
  return children;
}
