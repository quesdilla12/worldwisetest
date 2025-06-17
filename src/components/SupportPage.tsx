import React, { useState } from 'react';
import './LegalPage.css';

interface SupportPageProps {
  onBack: () => void;
}

const SupportPage: React.FC<SupportPageProps> = ({ onBack }) => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I get started with WordWise AI?",
      answer: "Simply create an account, upload or paste your text, and our AI will immediately start providing suggestions. The free tier gives you access to basic features, while premium unlocks advanced analysis tools."
    },
    {
      question: "Is my writing data secure and private?",
      answer: "Absolutely! We use end-to-end encryption, secure HTTPS connections, and never store your content with third-party AI providers. Your documents remain private and under your control."
    },
    {
      question: "What types of writing does WordWise AI support?",
      answer: "Our AI works with all types of writing including emails, essays, articles, creative writing, business documents, academic papers, and more. It adapts to different writing styles and contexts."
    },
    {
      question: "Can I use WordWise AI offline?",
      answer: "Currently, WordWise AI requires an internet connection to provide real-time AI analysis. However, you can draft offline and get suggestions when you reconnect."
    },
    {
      question: "How accurate are the AI suggestions?",
      answer: "Our AI provides highly accurate grammar and spelling corrections (95%+ accuracy), while style suggestions are contextual recommendations. Always review suggestions in your specific context."
    },
    {
      question: "What's included in the premium subscription?",
      answer: "Premium includes unlimited analysis, advanced style suggestions, plagiarism detection, collaboration tools, priority support, and access to specialized writing modes for different industries."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes! You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
    },
    {
      question: "Do you offer discounts for students or teams?",
      answer: "Yes! We offer 50% student discounts with valid edu email verification, and special team pricing for organizations with 5+ users. Contact our sales team for details."
    }
  ];

  return (
    <div className="legal-page">
      <header className="legal-header">
        <button onClick={onBack} className="back-button">
          ← Back to Home
        </button>
        <h1 className="legal-title">Support Center</h1>
        <div></div>
      </header>

      <div className="legal-container">
        <div className="hero-section">
          <span className="hero-icon">🎯</span>
          <h2 className="hero-title">How Can We Help?</h2>
          <p className="hero-subtitle">
            Find answers to common questions, learn how to get the most out of WordWise AI, 
            and get in touch with our support team when you need assistance.
          </p>
        </div>

        <div className="highlight-section">
          <span className="highlight-icon">🚀</span>
          <h3 className="highlight-title">Getting Started</h3>
          <div className="feature-grid">
            <div className="feature-item">
              <span className="feature-icon">👤</span>
              <h4 className="feature-title">Create Account</h4>
              <p className="feature-description">Sign up with your email to access all WordWise AI features</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📝</span>
              <h4 className="feature-title">Upload Text</h4>
              <p className="feature-description">Paste or upload your document to begin AI analysis</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <h4 className="feature-title">Get Suggestions</h4>
              <p className="feature-description">Review AI-powered grammar, style, and clarity recommendations</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✨</span>
              <h4 className="feature-title">Improve Writing</h4>
              <p className="feature-description">Apply suggestions and track your writing improvement over time</p>
            </div>
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="faq-section">
          <h3 className="faq-title">Frequently Asked Questions</h3>
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button 
                className="faq-question" 
                onClick={() => toggleFaq(index)}
              >
                <span>{faq.question}</span>
                <span className={`faq-icon ${expandedFaq === index ? 'expanded' : ''}`}>▼</span>
              </button>
              {expandedFaq === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="section-divider"></div>

        <div className="content-grid">
          <div className="content-card">
            <span className="card-icon">🔧</span>
            <h3 className="card-title">Troubleshooting</h3>
            <div className="card-content">
              <p><strong>Common Issues & Solutions:</strong></p>
              <ul>
                <li><strong>AI not detecting errors:</strong> Check language settings and text length requirements</li>
                <li><strong>Suggestions not loading:</strong> Refresh the page or check your internet connection</li>
                <li><strong>Documents not saving:</strong> Ensure you're logged in and have sufficient storage</li>
                <li><strong>Performance issues:</strong> Clear browser cache or try a different browser</li>
                <li><strong>Login problems:</strong> Reset password or check account verification status</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">💡</span>
            <h3 className="card-title">Tips & Best Practices</h3>
            <div className="card-content">
              <p><strong>Maximize Your Writing Quality:</strong></p>
              <ul>
                <li>Review all AI suggestions in context before applying</li>
                <li>Use the readability score to target your audience</li>
                <li>Take advantage of style mode settings for different writing types</li>
                <li>Regular writing practice improves AI suggestion accuracy</li>
                <li>Export your improved documents for future reference</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">⚡</span>
            <h3 className="card-title">Performance Tips</h3>
            <div className="card-content">
              <ul>
                <li>Keep documents under 10,000 words for optimal performance</li>
                <li>Use modern browsers (Chrome, Firefox, Safari latest versions)</li>
                <li>Stable internet connection ensures real-time suggestions</li>
                <li>Close unnecessary browser tabs to free up memory</li>
                <li>Regular account cleanup helps maintain speed</li>
              </ul>
            </div>
          </div>

          <div className="content-card">
            <span className="card-icon">🛠️</span>
            <h3 className="card-title">Feature Requests</h3>
            <div className="card-content">
              <p>Have an idea for a new feature? We'd love to hear from you!</p>
              <ul>
                <li>Submit feature requests through our feedback form</li>
                <li>Join our community Discord for feature discussions</li>
                <li>Vote on existing feature requests in our roadmap</li>
                <li>Beta test new features before they launch</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="tip-card">
          <h4 className="tip-title">Pro Tip</h4>
          <p className="tip-content">
            Use keyboard shortcuts to speed up your workflow: Ctrl+S to save, Ctrl+A to analyze, 
            and Ctrl+E to export your document. Check the help menu for a complete list of shortcuts!
          </p>
        </div>

        <div className="highlight-section">
          <span className="highlight-icon">📚</span>
          <h3 className="highlight-title">Learning Resources</h3>
          <div className="feature-grid">
            <div className="feature-item">
              <span className="feature-icon">📖</span>
              <h4 className="feature-title">User Guide</h4>
              <p className="feature-description">Comprehensive documentation covering all features</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎥</span>
              <h4 className="feature-title">Video Tutorials</h4>
              <p className="feature-description">Step-by-step video guides for getting started</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📝</span>
              <h4 className="feature-title">Writing Blog</h4>
              <p className="feature-description">Tips, tricks, and best practices for better writing</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <h4 className="feature-title">Community Forum</h4>
              <p className="feature-description">Connect with other writers and share experiences</p>
            </div>
          </div>
        </div>

        <div className="contact-section">
          <div className="contact-card">
            <span className="contact-icon">📧</span>
            <h4 className="contact-title">Email Support</h4>
            <p className="contact-info">
              <a href="mailto:support@wordwise-ai.com" className="contact-link">
                support@wordwise-ai.com
              </a>
              <br />
              <small>Response within 24 hours</small>
            </p>
          </div>
          <div className="contact-card">
            <span className="contact-icon">💬</span>
            <h4 className="contact-title">Live Chat</h4>
            <p className="contact-info">
              Available Mon-Fri 9AM-6PM PST
              <br />
              <small>Instant help for urgent issues</small>
            </p>
          </div>
          <div className="contact-card">
            <span className="contact-icon">🌐</span>
            <h4 className="contact-title">Community</h4>
            <p className="contact-info">
              Discord, Reddit & Twitter
              <br />
              <small>Connect with our community</small>
            </p>
          </div>
        </div>

        <div className="content-card" style={{ marginTop: '2rem' }}>
          <span className="card-icon">🚨</span>
          <h3 className="card-title">Emergency Support</h3>
          <div className="card-content">
            <p>For critical issues affecting your work or data:</p>
            <p><strong>Priority Support Hotline:</strong> Available for premium subscribers</p>
            <p><strong>Data Recovery:</strong> Contact us immediately if you've lost important documents</p>
            <p><strong>Security Concerns:</strong> Report suspicious activity or potential breaches</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 