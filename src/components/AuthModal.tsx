import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { loginAccount, registerAccount } from '../services/auth';
import type { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginAccount(email, password);
        if (res.success && res.user) {
          setSuccessMessage(`Welcome back, ${res.user.name || res.user.email}!`);
          setTimeout(() => {
            onLoginSuccess(res.user!);
          }, 400);
        } else {
          setErrorMessage(res.error || 'Failed to sign in. Please verify your credentials.');
        }
      } else {
        // Register Mode
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match. Please verify your password confirmation.');
          setLoading(false);
          return;
        }

        const res = await registerAccount(name, email, password);
        if (res.success && res.user) {
          setSuccessMessage(`Account created successfully! Welcome to LedgerPulse, ${res.user.name}.`);
          setTimeout(() => {
            onLoginSuccess(res.user!);
          }, 600);
        } else {
          setErrorMessage(res.error || 'Account creation failed. Please try again.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-card">
        {/* Header Header Brand */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <img src="/logo.png" alt="LedgerPulse" className="auth-logo-img" />
          </div>
          <h2 className="auth-title">LedgerPulse Cloud Ledger</h2>
          <p className="auth-subtitle">
            {mode === 'login' 
              ? 'Sign in to access your personal expenses and cloud financial history' 
              : 'Create a new account to start tracking your finances'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="auth-tabs-wrapper">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
          >
            <LogIn className="auth-tab-icon" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
          >
            <UserPlus className="auth-tab-icon" />
            <span>Create New Account</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="auth-alert alert-error">
            <AlertCircle className="alert-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert alert-success">
            <CheckCircle2 className="alert-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="auth-field-group">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <UserIcon className="auth-input-icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Mustan Sanawadwala"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>
          )}

          <div className="auth-field-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail className="auth-input-icon" />
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff className="eye-icon" /> : <Eye className="eye-icon" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="auth-field-group">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <ShieldCheck className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>
          )}

          <div className="auth-options-row">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="auth-checkbox"
              />
              <span>Keep me signed in on this device</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="auth-spinner"></span>
                <span>Authenticating...</span>
              </span>
            ) : mode === 'login' ? (
              <>
                <LogIn className="btn-icon" />
                <span>Sign In to Account</span>
              </>
            ) : (
              <>
                <UserPlus className="btn-icon" />
                <span>Register New Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Hint */}
        <div className="auth-footer-hint">
          {mode === 'login' ? (
            <p>
              New user?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
              >
                Create a new account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
