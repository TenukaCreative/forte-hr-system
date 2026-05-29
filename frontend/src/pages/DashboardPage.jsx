import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{
      minHeight: '100svh',
      background: '#FAFAF7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#C8203D',
          margin: '0 0 12px',
          fontStyle: 'normal',
        }}>
          Dashboard
        </p>
        <h1 style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '42px',
          fontWeight: 400,
          color: '#15161A',
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          {user?.name}
        </h1>
        <p style={{
          fontSize: '15px',
          color: 'rgba(21,22,26,0.5)',
          margin: '0 0 32px',
        }}>
          {user?.email} &nbsp;&middot;&nbsp;{' '}
          <span style={{ color: '#C8203D', fontWeight: 600 }}>
            {user?.role?.replace(/_/g, ' ')}
          </span>
        </p>
        <button
          onClick={logout}
          style={{
            padding: '10px 28px',
            background: 'transparent',
            color: '#15161A',
            border: '1.5px solid #DEDED8',
            borderRadius: '8px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 0.18s, background 0.18s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#C8203D';
            e.currentTarget.style.color = '#C8203D';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#DEDED8';
            e.currentTarget.style.color = '#15161A';
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
