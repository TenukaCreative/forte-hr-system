import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MicrosoftLogo = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  </svg>
);

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login();
      navigate('/dashboard');
    } catch (err) {
      if (
        err.message?.includes('user_cancelled') ||
        err.message?.includes('popup_window_error') ||
        err.message?.includes('BrowserAuthError')
      ) {
        setError('');
      } else {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark}>F</div>
          <span style={styles.logoText}>Forte TrackIT</span>
        </div>
        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.subheading}>
          Sign in with your Forte Insurance Microsoft account to continue.
        </p>
        {error && <div style={styles.errorBox}>{error}</div>}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...styles.msButton,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {!loading && <MicrosoftLogo />}
          {loading ? 'Signing in…' : 'Sign in with Microsoft'}
        </button>
        <p style={styles.hint}>
          Access is managed by your organisation's IT team.
          <br />
          Contact IT if you cannot sign in.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#FAFAF7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'Inter, sans-serif',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E4E3DC',
    boxShadow: '0 2px 16px rgba(21,22,26,0.08)',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  logoMark: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#C8203D',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#15161A',
    letterSpacing: '-0.3px',
  },
  heading: {
    margin: '0',
    fontSize: '22px',
    fontWeight: '700',
    color: '#15161A',
    letterSpacing: '-0.4px',
  },
  subheading: {
    margin: '0',
    fontSize: '14px',
    color: '#6B6B6B',
    lineHeight: '1.5',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '13px',
    color: '#DC2626',
    lineHeight: '1.4',
  },
  msButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: '#15161A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '13px 20px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
    width: '100%',
    marginTop: '8px',
    transition: 'background-color 0.15s',
  },
  hint: {
    margin: '0',
    fontSize: '12px',
    color: '#9B9B9B',
    textAlign: 'center',
    lineHeight: '1.6',
  },
};
