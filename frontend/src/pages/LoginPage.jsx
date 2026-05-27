import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import forteLogo from '../assets/forte-logo.webp';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // DEV ONLY — remove before production
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = () => {
    alert('Microsoft SSO is not yet configured.\nAzure AD credentials are pending from Forte IT.');
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logo */}
        <img
          src={forteLogo}
          alt="Forte"
          style={{ height: '70px', width: 'auto', display: 'block', margin: '0 auto 24px' }}
        />

        <h1 className="login-heading">Welcome back</h1>
        <p className="login-subheading">Sign in to your Forte account</p>

        {/* Error banner */}
        {error && (
          <div className="error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="#C8203D" strokeWidth="1.5" />
              <path d="M8 5v3.5" stroke="#C8203D" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.75" fill="#C8203D" />
            </svg>
            {error}
          </div>
        )}

        {/* Microsoft SSO */}
        <button type="button" className="btn-sso" onClick={handleSSO}>
          <svg width="20" height="20" viewBox="0 0 21 21" aria-hidden="true">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          Continue with Microsoft
        </button>

        <div className="login-divider">or continue with email</div>

        <form onSubmit={handleLogin} noValidate>

          {/* Email */}
          <div className="form-field">
            <label className="form-label" htmlFor="lp-email">Email address</label>
            <input
              id="lp-email"
              type="email"
              className="form-input"
              placeholder="you@forte.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="form-field">
            <label className="form-label" htmlFor="lp-password">Password</label>
            <div className="password-wrap">
              <input
                id="lp-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

{/* Remember me + Forgot password */}
          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-signin" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
