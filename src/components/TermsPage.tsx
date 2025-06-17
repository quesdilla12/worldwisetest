import React from 'react';
import './LegalPage.css';

interface TermsPageProps {
  onBack: () => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <button onClick={onBack} className="back-button">
          ← Back to Home
        </button>
        <h1 className="legal-title">Terms of Service</h1>
        <div></div>
      </header>

      <div className="legal-container">
        <div className="hero-section">
          <span className="hero-icon">📋</span>
          <h2 className="hero-title">Terms of Service</h2>
          <p className="hero-subtitle">
            Welcome to WordWise AI! These terms govern your use of our writing assistant service. 
            By using our platform, you agree to these terms and conditions.
          </p>
        </div>

        <div className="content-grid">
          <div className="content-card">
            <span className="card-icon">🚀</span>
            <h3 className="card-title">Service Description</h3>
            <div className="card-content">
              <p>WordWise AI provides:</p>
              <ul>
                <li>AI-powered writing suggestions and analysis</li>
                <li>Grammar and spelling correction tools</li>
                <li>Writing style and clarity improvements</li>
                <li>Document management and storage</li>
                <li>Real-time collaboration features</li>
                <li>Analytics and writing insights</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">✅</span>
            <h3 className="card-title">Acceptable Use</h3>
            <div className="card-content">
              <p>You agree to use our service responsibly:</p>
              <ul>
                <li>Follow all applicable laws and regulations</li>
                <li>Respect intellectual property rights</li>
                <li>No harmful, abusive, or illegal content</li>
                <li>No spam or unauthorized commercial use</li>
                <li>No attempts to hack or disrupt the service</li>
                <li>Maintain the security of your account</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">👤</span>
            <h3 className="card-title">User Accounts</h3>
            <div className="card-content">
              <ul>
                <li>You must provide accurate registration information</li>
                <li>Keep your login credentials secure and confidential</li>
                <li>You're responsible for all activity on your account</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>We may suspend accounts that violate these terms</li>
                <li>Account termination may result in data loss</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">📝</span>
            <h3 className="card-title">Your Content</h3>
            <div className="card-content">
              <ul>
                <li>You retain ownership of your original content</li>
                <li>You grant us license to process your content for AI analysis</li>
                <li>You're responsible for content legality and accuracy</li>
                <li>We don't claim ownership of your documents</li>
                <li>You can delete your content at any time</li>
                <li>Some content may be retained for service improvement</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="highlight-section">
          <span className="highlight-icon">🧠</span>
          <h3 className="highlight-title">Intellectual Property</h3>
          <div className="feature-grid">
            <div className="feature-item">
              <span className="feature-icon">🔧</span>
              <h4 className="feature-title">Our Technology</h4>
              <p className="feature-description">WordWise AI software, algorithms, and interface are our proprietary property</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📄</span>
              <h4 className="feature-title">Your Documents</h4>
              <p className="feature-description">You maintain full ownership and rights to your original content and documents</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <h4 className="feature-title">AI Suggestions</h4>
              <p className="feature-description">AI-generated suggestions are provided as-is without ownership claims</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚖️</span>
              <h4 className="feature-title">Fair Use</h4>
              <p className="feature-description">Use our service within reasonable limits and licensing terms</p>
            </div>
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="content-grid">
          <div className="content-card">
            <span className="card-icon">🔄</span>
            <h3 className="card-title">Service Availability</h3>
            <div className="card-content">
              <ul>
                <li>We strive for 99.9% uptime but don't guarantee it</li>
                <li>Scheduled maintenance may temporarily interrupt service</li>
                <li>We may modify features with reasonable notice</li>
                <li>Service interruptions don't extend subscription periods</li>
                <li>Emergency maintenance may occur without notice</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">💳</span>
            <h3 className="card-title">Billing & Payments</h3>
            <div className="card-content">
              <ul>
                <li>Free tier includes basic features with limitations</li>
                <li>Premium subscriptions are billed monthly or annually</li>
                <li>All fees are non-refundable unless required by law</li>
                <li>Auto-renewal can be canceled in account settings</li>
                <li>Price changes take effect at next billing cycle</li>
                <li>Failed payments may result in service suspension</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">⚠️</span>
            <h3 className="card-title">Disclaimers</h3>
            <div className="card-content">
              <ul>
                <li>AI suggestions are automated and may contain errors</li>
                <li>Always review AI recommendations before publishing</li>
                <li>We don't guarantee writing quality or accuracy</li>
                <li>Service provided "as-is" without warranties</li>
                <li>Not liable for content decisions or outcomes</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">🛡️</span>
            <h3 className="card-title">Limitation of Liability</h3>
            <div className="card-content">
              <ul>
                <li>Our liability is limited to subscription fees paid</li>
                <li>No liability for indirect or consequential damages</li>
                <li>Maximum liability capped at $100 per incident</li>
                <li>Force majeure events exclude liability</li>
                <li>Some jurisdictions may not allow liability limitations</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="tip-card">
          <h4 className="tip-title">Important Notice</h4>
          <p className="tip-content">
            These terms constitute the entire agreement between you and WordWise AI. 
            If any provision is found unenforceable, the remaining terms continue in effect.
          </p>
        </div>

        <div className="content-grid">
          <div className="content-card">
            <span className="card-icon">🏛️</span>
            <h3 className="card-title">Governing Law</h3>
            <div className="card-content">
              <p>These terms are governed by the laws of California, United States. Any disputes will be resolved in California state or federal courts. You waive rights to jury trial and class action lawsuits.</p>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">🔄</span>
            <h3 className="card-title">Termination</h3>
            <div className="card-content">
              <ul>
                <li>Either party may terminate with 30 days notice</li>
                <li>We may terminate immediately for terms violations</li>
                <li>Account data may be deleted after termination</li>
                <li>No refunds for early termination by user</li>
                <li>Survival clauses remain in effect post-termination</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">📝</span>
            <h3 className="card-title">Terms Modifications</h3>
            <div className="card-content">
              <p>We may update these terms periodically. Material changes will be announced via email or service notifications. Continued use after changes constitutes acceptance of new terms.</p>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">🌐</span>
            <h3 className="card-title">International Use</h3>
            <div className="card-content">
              <p>Our service is operated from the United States. Users accessing from other countries are responsible for compliance with local laws and regulations.</p>
            </div>
          </div>
        </div>

        <div className="contact-section">
          <div className="contact-card">
            <span className="contact-icon">⚖️</span>
            <h4 className="contact-title">Legal Questions</h4>
            <p className="contact-info">
              <a href="mailto:legal@wordwise-ai.com" className="contact-link">
                legal@wordwise-ai.com
              </a>
            </p>
          </div>
          <div className="contact-card">
            <span className="contact-icon">📋</span>
            <h4 className="contact-title">Terms Compliance</h4>
            <p className="contact-info">
              Report violations or compliance concerns
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

export default TermsPage; 