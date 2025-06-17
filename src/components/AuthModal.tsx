import React, { useState } from 'react';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'signin' | 'signup';
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailSignUp: (email: string, password: string, name: string) => Promise<void>;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  mode,
  onClose,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('🔐 AuthModal render:', { isOpen, mode });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        await onEmailSignIn(email, password);
      } else {
        await onEmailSignUp(email, password, name);
      }
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setLoading(true);
    setError('');
    try {
      await onGoogleSignIn();
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>
        
        <div className="auth-modal-content">
          <h2>{mode === 'signin' ? 'Sign In' : 'Sign Up'} to WordWise AI</h2>
          
          <button 
            className="auth-google-btn" 
            onClick={handleGoogleClick}
            disabled={loading}
          >
            <span className="google-icon">🔐</span>
            Continue with Google
          </button>
          
          <div className="auth-divider">
            <span>or</span>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            
            {error && <div className="auth-error">{error}</div>}
            
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Loading...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 