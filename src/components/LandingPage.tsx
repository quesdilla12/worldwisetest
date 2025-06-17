import React from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onViewDemo: () => void;
  onMyDocuments: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onPrivacy?: () => void;
  onTerms?: () => void;
  onSupport?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onViewDemo,
  onMyDocuments,
  onSignIn,
  onSignUp,
  onPrivacy,
  onTerms,
  onSupport
}) => {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <nav className="landing-nav">
          <div className="logo-section">
            <h1 className="app-logo">WordWise AI</h1>
            <span className="tagline">Your Intelligent Writing Assistant</span>
          </div>
          
          <div className="auth-buttons">
            <button className="btn-auth btn-signin" onClick={onSignIn}>
              Sign In
            </button>
            <button className="btn-auth btn-signup" onClick={onSignUp}>
              Sign Up
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">
            Write Better,<br />
            Write Smarter
          </h1>
          <p className="hero-description">
            Get real-time grammar suggestions, spelling corrections, and style 
            improvements powered by advanced AI. Whether you're a student, professional, or 
            content creator, WordWise AI helps you craft perfect text every time.
          </p>
        </section>

        {/* Call-to-Action Cards */}
        <section className="cta-section">
          <div className="cta-card" onClick={onViewDemo}>
            <span className="card-icon">🚀</span>
            <h3 className="card-title">Try the Demo</h3>
            <p className="card-description">
              Experience WordWise AI instantly without creating an account
            </p>
            <button className="btn-cta primary">
              View Demo
            </button>
          </div>
          
          <div className="cta-card" onClick={onMyDocuments}>
            <span className="card-icon">📁</span>
            <h3 className="card-title">My Documents</h3>
            <p className="card-description">
              Access your saved documents and writing projects
            </p>
            <button className="btn-cta secondary">
              My Documents
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="features-title">Why Choose WordWise AI?</h2>
          <p className="features-subtitle">
            Powerful AI-driven features designed to elevate your writing
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <h4 className="feature-title">Smart Suggestions</h4>
              <p className="feature-description">
                Get contextual writing improvements that understand your intent
              </p>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h4 className="feature-title">Real-time Analysis</h4>
              <p className="feature-description">
                See suggestions as you type with instant feedback
              </p>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">🔒</span>
              <h4 className="feature-title">Secure & Private</h4>
              <p className="feature-description">
                Your documents are protected with enterprise-grade security
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-copyright">
            © 2024 WordWise AI. Empowering writers worldwide.
          </div>
          <div className="footer-links">
            <button className="footer-link" onClick={onPrivacy}>Privacy</button>
            <button className="footer-link" onClick={onTerms}>Terms</button>
            <button className="footer-link" onClick={onSupport}>Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 