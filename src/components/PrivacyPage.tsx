import React from 'react';
import './LegalPage.css';

interface PrivacyPageProps {
  onBack: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <button onClick={onBack} className="back-button">
          ← Back to Home
        </button>
        <h1 className="legal-title">Privacy Policy</h1>
        <div></div>
      </header>

      <div className="legal-container">
        <div className="hero-section">
          <span className="hero-icon">🔒</span>
          <h2 className="hero-title">Your Privacy Matters</h2>
          <p className="hero-subtitle">
            We're committed to protecting your personal information and being transparent about how we use it. 
            Your trust is essential to everything we do.
          </p>
        </div>

        <div className="content-grid">
          <div className="content-card">
            <span className="card-icon">📊</span>
            <h3 className="card-title">Information We Collect</h3>
            <div className="card-content">
              <p><strong>Personal Information:</strong></p>
              <ul>
                <li>Email address and name for account creation</li>
                <li>Profile information you choose to provide</li>
                <li>Communication preferences</li>
              </ul>
              
              <p><strong>Document Data:</strong></p>
              <ul>
                <li>Text content you analyze with our AI</li>
                <li>Document metadata and usage patterns</li>
                <li>Writing statistics and improvement metrics</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">🎯</span>
            <h3 className="card-title">How We Use Your Data</h3>
            <div className="card-content">
              <ul>
                <li>Provide AI-powered writing suggestions and analysis</li>
                <li>Improve our machine learning models</li>
                <li>Maintain and enhance service functionality</li>
                <li>Send important account and service updates</li>
                <li>Provide customer support when needed</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">🛡️</span>
            <h3 className="card-title">Data Security</h3>
            <div className="card-content">
              <ul>
                <li>End-to-end encryption for all data transmission</li>
                <li>Secure HTTPS connections for all communications</li>
                <li>Regular security audits and penetration testing</li>
                <li>Firebase's enterprise-grade security infrastructure</li>
                <li>Limited access controls and employee training</li>
                <li>Automatic data backup and disaster recovery</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">🤝</span>
            <h3 className="card-title">Third-Party Services</h3>
            <div className="card-content">
              <p>We work with trusted partners to provide our services:</p>
              <ul>
                <li><strong>Firebase (Google):</strong> Authentication, database, and hosting</li>
                <li><strong>OpenAI:</strong> AI-powered text analysis and suggestions</li>
                <li><strong>Analytics Services:</strong> Anonymous usage statistics</li>
              </ul>
              <p>These partners have their own privacy policies and security measures.</p>
            </div>
          </div>
        </div>

        <div className="highlight-section">
          <span className="highlight-icon">⚖️</span>
          <h3 className="highlight-title">Your Rights & Control</h3>
          <div className="feature-grid">
            <div className="feature-item">
              <span className="feature-icon">👁️</span>
              <h4 className="feature-title">Access Your Data</h4>
              <p className="feature-description">Request a copy of all personal data we have about you</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✏️</span>
              <h4 className="feature-title">Correct Information</h4>
              <p className="feature-description">Update or correct any inaccurate personal information</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🗑️</span>
              <h4 className="feature-title">Delete Your Data</h4>
              <p className="feature-description">Request deletion of your account and associated data</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📦</span>
              <h4 className="feature-title">Data Portability</h4>
              <p className="feature-description">Export your data in a machine-readable format</p>
            </div>
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="content-grid">
          <div className="content-card">
            <span className="card-icon">⏰</span>
            <h3 className="card-title">Data Retention</h3>
            <div className="card-content">
              <ul>
                <li>Account data: Retained while your account is active</li>
                <li>Document content: You control retention through your account</li>
                <li>Usage analytics: Anonymized data kept for service improvement</li>
                <li>Deleted accounts: Data removed within 30 days of deletion request</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">👶</span>
            <h3 className="card-title">Children's Privacy</h3>
            <div className="card-content">
              <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information immediately.</p>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">🌍</span>
            <h3 className="card-title">International Users</h3>
            <div className="card-content">
              <p>We comply with international privacy laws including GDPR, CCPA, and other regional privacy regulations. Your data may be processed in the United States and other countries where our service providers operate.</p>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">🔄</span>
            <h3 className="card-title">Policy Updates</h3>
            <div className="card-content">
              <p>We may update this privacy policy from time to time. We will notify you of any material changes via email or through our service. The latest version will always be available on this page.</p>
            </div>
          </div>
        </div>

        <div className="tip-card">
          <h4 className="tip-title">Privacy Tip</h4>
          <p className="tip-content">
            You can always review and manage your privacy settings in your account dashboard. 
            We believe you should have full control over your personal information.
          </p>
        </div>

        <div className="contact-section">
          <div className="contact-card">
            <span className="contact-icon">📧</span>
            <h4 className="contact-title">Privacy Questions</h4>
            <p className="contact-info">
              <a href="mailto:privacy@wordwise-ai.com" className="contact-link">
                privacy@wordwise-ai.com
              </a>
            </p>
          </div>
          <div className="contact-card">
            <span className="contact-icon">📞</span>
            <h4 className="contact-title">Data Protection Officer</h4>
            <p className="contact-info">
              Available for GDPR and privacy rights inquiries
            </p>
          </div>
          <div className="contact-card">
            <span className="contact-icon">📅</span>
            <h4 className="contact-title">Last Updated</h4>
            <p className="contact-info">
              January 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage; 