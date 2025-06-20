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
            Master College Essays<br />
            as an <span>ESL Student</span>
          </h1>
          <p className="hero-description">
            The only AI writing assistant built specifically for ESL students. Get grammar corrections 
            <em> with clear explanations</em> to learn English patterns, vocabulary upgrades that sound natural, 
            and sentence clarity improvements that make your ideas shine. Transform your essays from good to exceptional.
          </p>
        </section>

        {/* Call-to-Action Cards */}
        <section className="cta-section">
          <div className="cta-card" onClick={onViewDemo}>
            <span className="card-icon">🎓</span>
            <h3 className="card-title">Try ESL Demo</h3>
            <p className="card-description">
              See how WordWise fixes common ESL errors and explains the grammar rules
            </p>
            <button className="btn-cta primary">
              Try Demo
            </button>
          </div>
          
                      <div className="cta-card" onClick={onMyDocuments}>
              <span className="card-icon">📚</span>
              <h3 className="card-title">My Documents</h3>
              <p className="card-description">
                Access your saved college essays and track your writing progress
              </p>
              <button className="btn-cta secondary">
                My Documents
              </button>
            </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="features-title">Built for ESL College Writers</h2>
          <p className="features-subtitle">
            "I want to understand <em>why</em> my grammar is wrong, not just get it fixed" - Real ESL student feedback
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">📖</span>
              <h4 className="feature-title">Grammar Coach</h4>
              <p className="feature-description">
                <strong>"I want grammar corrections with explanations so I can learn English patterns"</strong><br/>
                Every correction comes with a clear explanation of the grammar rule, helping you learn, not just fix.
              </p>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <h4 className="feature-title">Vocabulary Booster</h4>
              <p className="feature-description">
                <strong>"I want vocabulary suggestions to use more advanced words appropriately"</strong><br/>
                Get academic-level word suggestions that fit your context and sound natural to native speakers.
              </p>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">💡</span>
              <h4 className="feature-title">Clarity Enhancer</h4>
              <p className="feature-description">
                <strong>"I want clarity improvements to make my ideas easier to understand"</strong><br/>
                Transform complex, tangled sentences into clear, powerful statements that professors love.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-copyright">
            © 2024 WordWise AI. Empowering ESL students to excel in college writing.
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