import React, { useState, useEffect } from 'react';
import type { User as FirebaseUser } from '../firebase/auth';
import './AccountPage.css';

interface AccountPageProps {
  user: FirebaseUser;
  onBack: () => void;
}

interface UserPreferences {
  analysisLevel: 'basic' | 'intermediate' | 'advanced';
  focusAreas: string[];
  targetAudience: 'academic' | 'professional' | 'creative' | 'general';
  language: 'en-US' | 'en-UK' | 'en-CA';
  autoAnalysis: boolean;
  showConfidence: boolean;
  emailNotifications: boolean;
  weeklyReports: boolean;
}

const AccountPage: React.FC<AccountPageProps> = ({ user, onBack }) => {
  console.log('AccountPage rendering with user:', user);
  
  // Validate user object
  if (!user) {
    console.error('AccountPage: No user provided');
    return (
      <div className="account-page">
        <div className="account-header">
          <button className="back-button" onClick={onBack}>← Back</button>
          <h1>⚠️ No User Data</h1>
          <p>Please sign in to access account settings.</p>
        </div>
      </div>
    );
  }
  
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'data'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    analysisLevel: 'intermediate',
    focusAreas: ['grammar', 'clarity', 'style'],
    targetAudience: 'academic',
    language: 'en-US',
    autoAnalysis: true,
    showConfidence: true,
    emailNotifications: true,
    weeklyReports: false
  });
  
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    email: user.email || '',
    bio: '',
    writingGoals: 'Improve my college essay writing skills',
    accountType: user.userType || 'student' as 'student' | 'professional' | 'creator'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    // Load user preferences from localStorage or Firebase
    const savedPreferences = localStorage.getItem(`preferences_${user.id}`);
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, [user.id]);

  const savePreferences = () => {
    localStorage.setItem(`preferences_${user.id}`, JSON.stringify(preferences));
    alert('Preferences saved successfully!');
  };

  const handleProfileSave = () => {
    // In a real app, this would update the user profile in Firebase
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    // In a real app, this would update the password in Firebase Auth
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordChange(false);
    alert('Password updated successfully!');
  };

  const exportData = () => {
    const userData = {
      profile: profileData,
      preferences: preferences,
      analytics: localStorage.getItem(`sessions_${user.id}`),
      documents: localStorage.getItem(`documents_${user.id}`)
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wordwise-data-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const deleteAccount = () => {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation === 'DELETE') {
      // In a real app, this would delete the user account from Firebase
      alert('Account deletion requested. You will receive a confirmation email.');
    }
  };

  const renderProfileTab = () => (
    <div className="account-section">
      <div className="section-header">
        <h3>Profile Information</h3>
        <button 
          className={`btn-edit ${isEditing ? 'active' : ''}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : '✏️ Edit'}
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
          {isEditing && (
            <button className="btn-avatar-change">Change Photo</button>
          )}
        </div>

        <div className="profile-fields">
          <div className="field-group">
            <label>Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                className="profile-input"
              />
            ) : (
              <span className="field-value">{profileData.name}</span>
            )}
          </div>

          <div className="field-group">
            <label>Email Address</label>
            <span className="field-value">{profileData.email}</span>
            <small>Email changes require verification</small>
          </div>

          <div className="field-group">
            <label>Account Type</label>
            {isEditing ? (
              <select
                value={profileData.accountType}
                onChange={(e) => setProfileData({...profileData, accountType: e.target.value as 'student' | 'professional' | 'creator'})}
                className="profile-select"
              >
                <option value="student">Student</option>
                <option value="professional">Professional</option>
                <option value="creator">Creator</option>
              </select>
            ) : (
              <span className="field-value">{profileData.accountType}</span>
            )}
          </div>

          <div className="field-group">
            <label>Bio</label>
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                className="profile-textarea"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <span className="field-value">{profileData.bio || 'No bio added yet'}</span>
            )}
          </div>

          <div className="field-group">
            <label>Writing Goals</label>
            {isEditing ? (
              <textarea
                value={profileData.writingGoals}
                onChange={(e) => setProfileData({...profileData, writingGoals: e.target.value})}
                className="profile-textarea"
                placeholder="What are your writing goals?"
              />
            ) : (
              <span className="field-value">{profileData.writingGoals}</span>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="profile-actions">
            <button className="btn-save" onClick={handleProfileSave}>
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="account-stats">
        <h4>Account Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Member Since</span>
            <span className="stat-value">
              {(() => {
                try {
                  if (!user.createdAt) return 'Recently';
                  if (user.createdAt instanceof Date) {
                    return user.createdAt.toLocaleDateString();
                  }
                  return new Date(user.createdAt).toLocaleDateString();
                } catch (error) {
                  console.warn('Error formatting date:', error);
                  return 'Recently';
                }
              })()}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last Login</span>
            <span className="stat-value">Today</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Documents</span>
            <span className="stat-value">12</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Words Written</span>
            <span className="stat-value">15,430</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="account-section">
      <div className="section-header">
        <h3>Writing Preferences</h3>
        <button className="btn-save" onClick={savePreferences}>
          Save Preferences
        </button>
      </div>

      <div className="preferences-grid">
        <div className="preference-card">
          <h4>Analysis Settings</h4>
          
          <div className="preference-group">
            <label>Analysis Level</label>
            <select
              value={preferences.analysisLevel}
              onChange={(e) => setPreferences({...preferences, analysisLevel: e.target.value as any})}
              className="preference-select"
            >
              <option value="basic">Basic - Essential errors only</option>
              <option value="intermediate">Intermediate - Grammar + style</option>
              <option value="advanced">Advanced - Comprehensive analysis</option>
            </select>
          </div>

          <div className="preference-group">
            <label>Target Audience</label>
            <select
              value={preferences.targetAudience}
              onChange={(e) => setPreferences({...preferences, targetAudience: e.target.value as any})}
              className="preference-select"
            >
              <option value="academic">Academic Writing</option>
              <option value="professional">Professional Communication</option>
              <option value="creative">Creative Writing</option>
              <option value="general">General Purpose</option>
            </select>
          </div>

          <div className="preference-group">
            <label>Language Variant</label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences({...preferences, language: e.target.value as any})}
              className="preference-select"
            >
              <option value="en-US">American English</option>
              <option value="en-UK">British English</option>
              <option value="en-CA">Canadian English</option>
            </select>
          </div>
        </div>

        <div className="preference-card">
          <h4>Focus Areas</h4>
          <div className="focus-areas">
            {['grammar', 'spelling', 'style', 'clarity', 'conciseness', 'tone'].map(area => (
              <label key={area} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.focusAreas.includes(area)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPreferences({
                        ...preferences,
                        focusAreas: [...preferences.focusAreas, area]
                      });
                    } else {
                      setPreferences({
                        ...preferences,
                        focusAreas: preferences.focusAreas.filter(a => a !== area)
                      });
                    }
                  }}
                />
                <span className="checkbox-text">{area.charAt(0).toUpperCase() + area.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="preference-card">
          <h4>Interface Settings</h4>
          
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={preferences.autoAnalysis}
              onChange={(e) => setPreferences({...preferences, autoAnalysis: e.target.checked})}
            />
            <span className="toggle-text">Auto-analyze text as I type</span>
          </label>

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={preferences.showConfidence}
              onChange={(e) => setPreferences({...preferences, showConfidence: e.target.checked})}
            />
            <span className="toggle-text">Show confidence scores</span>
          </label>
        </div>

        <div className="preference-card">
          <h4>Notifications</h4>
          
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(e) => setPreferences({...preferences, emailNotifications: e.target.checked})}
            />
            <span className="toggle-text">Email notifications</span>
          </label>

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={preferences.weeklyReports}
              onChange={(e) => setPreferences({...preferences, weeklyReports: e.target.checked})}
            />
            <span className="toggle-text">Weekly progress reports</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="account-section">
      <div className="section-header">
        <h3>Security Settings</h3>
      </div>

      <div className="security-card">
        <h4>Password</h4>
        <p>Keep your account secure with a strong password</p>
        
        {!showPasswordChange ? (
          <button 
            className="btn-change-password"
            onClick={() => setShowPasswordChange(true)}
          >
            Change Password
          </button>
        ) : (
          <div className="password-change-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="security-input"
              />
            </div>
            
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="security-input"
              />
            </div>
            
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="security-input"
              />
            </div>

            <div className="form-actions">
              <button className="btn-save" onClick={handlePasswordChange}>
                Update Password
              </button>
              <button 
                className="btn-cancel"
                onClick={() => setShowPasswordChange(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="security-card">
        <h4>Two-Factor Authentication</h4>
        <p>Add an extra layer of security to your account</p>
        <button className="btn-enable-2fa">
          Enable 2FA
        </button>
      </div>

      <div className="security-card">
        <h4>Login History</h4>
        <div className="login-history">
          <div className="login-item">
            <div className="login-info">
              <span className="login-location">San Francisco, CA</span>
              <span className="login-time">Today at 2:30 PM</span>
            </div>
            <span className="login-status current">Current Session</span>
          </div>
          <div className="login-item">
            <div className="login-info">
              <span className="login-location">San Francisco, CA</span>
              <span className="login-time">Yesterday at 9:15 AM</span>
            </div>
            <span className="login-status">Chrome on macOS</span>
          </div>
          <div className="login-item">
            <div className="login-info">
              <span className="login-location">San Francisco, CA</span>
              <span className="login-time">3 days ago at 4:22 PM</span>
            </div>
            <span className="login-status">Safari on iPhone</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="account-section">
      <div className="section-header">
        <h3>Data & Privacy</h3>
      </div>

      <div className="data-card">
        <h4>Export Your Data</h4>
        <p>Download a copy of your WordWise data including documents, analytics, and preferences</p>
        <button className="btn-export" onClick={exportData}>
          📥 Export Data
        </button>
      </div>

      <div className="data-card">
        <h4>Data Usage</h4>
        <div className="usage-stats">
          <div className="usage-item">
            <span className="usage-label">Documents Stored</span>
            <span className="usage-value">12 documents</span>
          </div>
          <div className="usage-item">
            <span className="usage-label">Analytics Data</span>
            <span className="usage-value">3 months</span>
          </div>
          <div className="usage-item">
            <span className="usage-label">Storage Used</span>
            <span className="usage-value">2.3 MB</span>
          </div>
        </div>
      </div>

      <div className="data-card">
        <h4>Privacy Settings</h4>
        <div className="privacy-options">
          <label className="toggle-label">
            <input type="checkbox" defaultChecked />
            <span className="toggle-text">Allow analytics for improving WordWise</span>
          </label>
          <label className="toggle-label">
            <input type="checkbox" defaultChecked />
            <span className="toggle-text">Personalized writing suggestions</span>
          </label>
          <label className="toggle-label">
            <input type="checkbox" />
            <span className="toggle-text">Share anonymous usage data</span>
          </label>
        </div>
      </div>

      <div className="data-card danger">
        <h4>Delete Account</h4>
        <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button className="btn-delete" onClick={deleteAccount}>
          🗑️ Delete Account
        </button>
      </div>
    </div>
  );

  try {
    return (
      <div className="account-page">
        <div className="account-header">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <h1>⚙️ Account Settings</h1>
          <p>Manage your profile, preferences, and account security</p>
        </div>

        <div className="account-tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button 
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button 
            className={`tab ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Data & Privacy
          </button>
        </div>

        <div className="account-content">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'preferences' && renderPreferencesTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'data' && renderDataTab()}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AccountPage:', error);
    return (
      <div className="account-page">
        <div className="account-header">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <h1>⚠️ Error Loading Account</h1>
          <p>There was an error loading the account page. Please try again.</p>
        </div>
      </div>
    );
  }
};

export default AccountPage; 