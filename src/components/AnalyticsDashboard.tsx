import React, { useState, useEffect } from 'react';
import { analyticsService, type UserProgress, type UsageAnalytics } from '../services/analyticsService';
import './AnalyticsDashboard.css';

interface AnalyticsDashboardProps {
  userId: string;
  onBack: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId, onBack }) => {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'progress' | 'goals' | 'patterns' | 'overview'>('progress');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [progress, usage] = await Promise.all([
        analyticsService.getUserProgress(userId),
        analyticsService.getUsageAnalytics()
      ]);
      
      setUserProgress(progress);
      setUsageAnalytics(usage);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-content">
          <h2>📊 Loading Analytics...</h2>
          <p>Analyzing your writing progress</p>
        </div>
      </div>
    );
  }

  const getAcceptanceRate = () => {
    if (!userProgress) return 0;
    const { totalSuggestionsReceived, totalSuggestionsApplied } = userProgress;
    return totalSuggestionsReceived > 0 
      ? Math.round((totalSuggestionsApplied / totalSuggestionsReceived) * 100)
      : 0;
  };

  const renderProgressTab = () => (
    <div className="analytics-section">
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{userProgress?.totalSessions || 0}</h3>
            <p>Writing Sessions</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{userProgress?.averageWritingScore || 0}</h3>
            <p>Average Score</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{getAcceptanceRate()}%</h3>
            <p>Acceptance Rate</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✍️</div>
          <div className="stat-content">
            <h3>{userProgress?.totalWordsWritten || 0}</h3>
            <p>Words Written</p>
          </div>
        </div>
      </div>

      <div className="improvement-areas">
        <h3>Improvement Areas</h3>
        <div className="areas-grid">
          {userProgress && Object.entries(userProgress.improvementAreas).map(([area, data]) => (
            <div key={area} className="area-card">
              <div className="area-header">
                <h4>{area.charAt(0).toUpperCase() + area.slice(1)}</h4>
                <span className={`rate ${data.rate >= 70 ? 'good' : data.rate >= 50 ? 'medium' : 'needs-work'}`}>
                  {data.rate}%
                </span>
              </div>
              <div className="area-stats">
                <div className="area-stat">
                  <span>Received:</span>
                  <span>{data.received}</span>
                </div>
                <div className="area-stat">
                  <span>Applied:</span>
                  <span>{data.applied}</span>
                </div>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${data.rate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="weekly-progress">
        <h3>Weekly Progress</h3>
        <div className="progress-chart">
          {userProgress?.weeklyProgress.map((week, index) => (
            <div key={week.week} className="week-bar">
              <div className="week-data">
                <div className="week-label">Week {index + 1}</div>
                <div className="week-score">{week.averageScore}</div>
                <div className="week-words">{week.wordsWritten}w</div>
              </div>
              <div className="week-visual">
                <div 
                  className="score-bar" 
                  style={{ height: `${week.averageScore}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGoalsTab = () => (
    <div className="analytics-section">
      <h3>Learning Goals</h3>
      <div className="goals-list">
        {userProgress?.learningGoals.map((goal, index) => (
          <div key={index} className={`goal-card ${goal.achieved ? 'achieved' : ''}`}>
            <div className="goal-header">
              <h4>{goal.target}</h4>
              <span className="goal-progress">{goal.progress}%</span>
            </div>
            <div className="goal-bar">
              <div 
                className="goal-fill" 
                style={{ width: `${Math.min(goal.progress, 100)}%` }}
              ></div>
            </div>
            <div className="goal-status">
              {goal.achieved ? '🎉 Achieved!' : `${100 - goal.progress}% to go`}
            </div>
          </div>
        ))}
      </div>

      <div className="goal-suggestions">
        <h4>Suggested Next Steps</h4>
        <div className="suggestions-list">
          <div className="suggestion-item">
            <span className="suggestion-icon">🎯</span>
            <span>Focus on applying grammar suggestions to improve your acceptance rate</span>
          </div>
          <div className="suggestion-item">
            <span className="suggestion-icon">📚</span>
            <span>Practice writing longer documents to increase your word count</span>
          </div>
          <div className="suggestion-item">
            <span className="suggestion-icon">⏰</span>
            <span>Set a daily writing schedule to build consistency</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatternsTab = () => (
    <div className="analytics-section">
      <h3>Usage Patterns</h3>
      
      <div className="patterns-grid">
        <div className="pattern-card">
          <h4>Most Common Issues</h4>
          <div className="issue-list">
            {usageAnalytics?.mostCommonSuggestionTypes.map((type, index) => (
              <div key={type.type} className="issue-item">
                <div className="issue-rank">#{index + 1}</div>
                <div className="issue-content">
                  <span className="issue-type">{type.type}</span>
                  <span className="issue-count">{type.count} suggestions</span>
                  <span className="issue-rate">{type.rate}% applied</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pattern-card">
          <h4>Writing Habits</h4>
          <div className="habits-list">
            <div className="habit-item">
              <span className="habit-label">Average Session Time</span>
              <span className="habit-value">{usageAnalytics?.averageSessionTime} minutes</span>
            </div>
            <div className="habit-item">
              <span className="habit-label">Most Productive Time</span>
              <span className="habit-value">Evening (7-9 PM)</span>
            </div>
            <div className="habit-item">
              <span className="habit-label">Preferred Document Type</span>
              <span className="habit-value">Essays</span>
            </div>
          </div>
        </div>
      </div>

      <div className="feature-usage">
        <h4>Feature Usage</h4>
        <div className="feature-stats">
          {usageAnalytics && Object.entries(usageAnalytics.featureUsage).map(([feature, count]) => (
            <div key={feature} className="feature-stat">
              <div className="feature-name">
                {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </div>
              <div className="feature-count">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="analytics-section">
      <h3>Platform Overview</h3>
      
      <div className="overview-stats">
        <div className="overview-card">
          <h4>User Base</h4>
          <div className="overview-metric">
            <span className="metric-value">{usageAnalytics?.totalUsers}</span>
            <span className="metric-label">Total Users</span>
          </div>
          <div className="overview-metric">
            <span className="metric-value">{usageAnalytics?.activeUsers}</span>
            <span className="metric-label">Active Users</span>
          </div>
        </div>

        <div className="overview-card">
          <h4>Retention Rates</h4>
          <div className="retention-list">
            <div className="retention-item">
              <span>Daily: {usageAnalytics?.userRetention.daily}%</span>
              <div className="retention-bar">
                <div style={{ width: `${usageAnalytics?.userRetention.daily}%` }}></div>
              </div>
            </div>
            <div className="retention-item">
              <span>Weekly: {usageAnalytics?.userRetention.weekly}%</span>
              <div className="retention-bar">
                <div style={{ width: `${usageAnalytics?.userRetention.weekly}%` }}></div>
              </div>
            </div>
            <div className="retention-item">
              <span>Monthly: {usageAnalytics?.userRetention.monthly}%</span>
              <div className="retention-bar">
                <div style={{ width: `${usageAnalytics?.userRetention.monthly}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>📊 Analytics Dashboard</h1>
        <p>Track your writing progress and improvement</p>
      </div>

      <div className="analytics-tabs">
        <button 
          className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Progress
        </button>
        <button 
          className={`tab ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          Goals
        </button>
        <button 
          className={`tab ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          Patterns
        </button>
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
      </div>

      <div className="analytics-content">
        {activeTab === 'progress' && renderProgressTab()}
        {activeTab === 'goals' && renderGoalsTab()}
        {activeTab === 'patterns' && renderPatternsTab()}
        {activeTab === 'overview' && renderOverviewTab()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 