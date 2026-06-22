import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { C, card, fieldLabel, inputStyle } from '../components/theme';
import { Button, Spinner } from '../components/ui';
import forteLogo from '../assets/forte-logo.webp';

export default function ProfileCompletePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/employees/profile-status')
      .then((r) => {
        setStatus(r.data);
        setContactNumber(r.data?.contactNumber || '');
        setJoinDate(r.data?.joinDate || '');
      })
      .catch(() => setLoadError(true));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!contactNumber.trim() || !joinDate) {
      setError('Please fill in all fields.');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/employees/profile', { contactNumber: contactNumber.trim(), joinDate });
      // Reload the user from the server and update the cached auth state.
      const { data } = await api.get('/auth/me');
      refreshUser({ ...user, ...data });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const wrap = {
    minHeight: '100vh', background: C.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  };
  const panel = { ...card, maxWidth: 440, width: '100%', textAlign: 'center' };
  const heading = { fontSize: 22, fontWeight: 700, color: C.dark, margin: '0 0 8px', letterSpacing: '-0.02em' };
  const message = { fontSize: 14, color: C.muted, margin: '0 0 24px', lineHeight: 1.5 };

  const renderBody = () => {
    if (loadError) {
      return (
        <>
          <h1 style={heading}>Something went wrong</h1>
          <p style={message}>We couldn’t load your profile status. Please try again.</p>
          <Button variant="ghost" onClick={logout} style={{ width: '100%' }}>Log out</Button>
        </>
      );
    }

    if (status === null) return <Spinner />;

    // STATE A — role not yet assigned
    if (!status.assignedRoleId) {
      return (
        <>
          <h1 style={heading}>Account Setup in Progress</h1>
          <p style={message}>
            Your account has been created successfully. An administrator will assign your
            role shortly. Please check back soon.
          </p>
          <Button variant="ghost" onClick={logout} style={{ width: '100%' }}>Log out</Button>
        </>
      );
    }

    // STATE B — role assigned, contact number / join date missing
    return (
      <>
        <h1 style={heading}>Complete Your Profile</h1>
        <p style={message}>Please fill in the following details to continue.</p>
        <form onSubmit={submit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>Contact Number</label>
            <input
              style={inputStyle}
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+94 77 000 0000"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>Join Date</label>
            <input
              type="date"
              style={inputStyle}
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: C.red, margin: '0 0 16px', padding: '10px 12px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8 }}>
              {error}
            </p>
          )}

          <Button type="submit" disabled={saving} style={{ width: '100%', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save & Continue'}
          </Button>
        </form>
      </>
    );
  };

  return (
    <div style={wrap}>
      <div style={panel}>
        <img src={forteLogo} alt="Forte" style={{ height: 40, marginBottom: 24 }} />
        {renderBody()}
      </div>
    </div>
  );
}
