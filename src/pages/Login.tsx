import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ns-login-page">
      <div className="ns-login-card">
        <div className="ns-login-header">
          <div className="ns-brand-mark" style={{ width: 48, height: 48, borderRadius: 14 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 17 L9 11 L13 14 L21 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="21" cy="6" r="2" fill="white"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 16 }}>NeuraStock</h1>
          <p style={{ fontSize: 13, color: 'var(--ns-text-3)', marginTop: 4 }}>Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="ns-login-form">
          {error && (
            <div className="ns-login-error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="ns-login-field">
            <label className="ns-login-label">Username</label>
            <div className="ns-login-input-wrap">
              <User size={16} className="ns-login-input-icon" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="ns-login-input"
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="ns-login-field">
            <label className="ns-login-label">Password</label>
            <div className="ns-login-input-wrap">
              <Lock size={16} className="ns-login-input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ns-login-input"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="ns-login-btn" disabled={isLoading}>
            {isLoading ? (
              <div className="ns-ai-orb" style={{ width: 16, height: 16 }} />
            ) : (
              <>Sign In <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p style={{ fontSize: 11, color: 'var(--ns-text-4)', textAlign: 'center', marginTop: 24 }}>
          AI-Powered Stock Analysis Platform
        </p>
      </div>
    </div>
  );
};

export default Login;
