import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <div style={styles.card}>
          <div style={styles.icon}>📦</div>
          <h1 style={styles.title}>Asset Management System</h1>
          <p style={styles.subtitle}>Sign in to manage your assets</p>
          <form onSubmit={handleSubmit} style={styles.form}>
            {isRegister && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input"
                style={styles.input}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="input"
              style={styles.input}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" className="btn" style={styles.btn}>
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={styles.switch}
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
      <div style={styles.right}>
        <img src="/assets/login_bg.jpg.jpeg" alt="Asset Management" style={styles.img} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexWrap: 'wrap',
  },
  left: {
    flex: '1 1 400px',
    minWidth: 280,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  right: {
    flex: '1 1 400px',
    minWidth: 280,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // padding: '1.5rem',
    background: 'rgba(255,255,255,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  icon: { fontSize: '2.5rem', textAlign: 'center', marginBottom: '0.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', color: '#0f172a', marginBottom: '0.25rem' },
  subtitle: { fontSize: '0.9rem', color: '#64748b', textAlign: 'center', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { margin: 0 },
  error: { color: '#ef4444', fontSize: '0.875rem' },
  btn: { padding: '0.75rem', marginTop: '0.25rem' },
  switch: {
    marginTop: '1.25rem',
    background: 'none',
    border: 'none',
    color: '#0ea5e9',
    fontSize: '0.9rem',
    width: '100%',
    textAlign: 'center',
  },
  img: { maxWidth: '100vh', maxHeight: '100vh', objectFit: 'contain' },
};
