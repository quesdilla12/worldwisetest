// Analytics Service for WordWise AI
// Tracks user behavior, suggestion acceptance, usage patterns, and learning progress

export interface SuggestionEvent {
  id: string;
  userId: string;
  documentId: string;
  suggestionId: string;
  suggestionType: 'grammar' | 'spelling' | 'style' | 'clarity' | 'conciseness' | 'engagement' | 'tone';
  severity: 'error' | 'warning' | 'suggestion';
  action: 'applied' | 'rejected' | 'ignored';
  confidence: number;
  timestamp: Date;
  sessionId: string;
}

export interface WritingSession {
  id: string;
  userId: string;
  documentId: string;
  startTime: Date;
  endTime?: Date;
  wordsWritten: number;
  suggestionsReceived: number;
  suggestionsApplied: number;
  timeSpent: number; // in minutes
  writingScore: number;
  improvements: string[];
}

export interface UserProgress {
  userId: string;
  totalSessions: number;
  totalWordsWritten: number;
  totalSuggestionsReceived: number;
  totalSuggestionsApplied: number;
  averageWritingScore: number;
  improvementAreas: {
    grammar: { received: number; applied: number; rate: number };
    spelling: { received: number; applied: number; rate: number };
    style: { received: number; applied: number; rate: number };
    clarity: { received: number; applied: number; rate: number };
  };
  weeklyProgress: {
    week: string;
    sessionsCount: number;
    wordsWritten: number;
    averageScore: number;
    topImprovements: string[];
  }[];
  learningGoals: {
    target: string;
    progress: number;
    achieved: boolean;
  }[];
}

export interface UsageAnalytics {
  totalUsers: number;
  activeUsers: number;
  averageSessionTime: number;
  mostCommonSuggestionTypes: { type: string; count: number; rate: number }[];
  userRetention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  featureUsage: {
    applyAllSuggestions: number;
    revertSuggestions: number;
    documentCreation: number;
    demoUsage: number;
  };
}

class AnalyticsService {
  private currentSession: WritingSession | null = null;
  private sessionId: string = '';

  constructor() {
    this.generateSessionId();
  }

  private generateSessionId(): void {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start a new writing session
  startSession(userId: string, documentId: string): WritingSession {
    this.endCurrentSession();
    
    const session: WritingSession = {
      id: `session-${Date.now()}`,
      userId,
      documentId,
      startTime: new Date(),
      wordsWritten: 0,
      suggestionsReceived: 0,
      suggestionsApplied: 0,
      timeSpent: 0,
      writingScore: 0,
      improvements: []
    };

    this.currentSession = session;
    console.log('📊 Analytics: Started new session', session.id);
    return session;
  }

  // End current session
  endCurrentSession(): void {
    if (this.currentSession && !this.currentSession.endTime) {
      this.currentSession.endTime = new Date();
      this.currentSession.timeSpent = Math.round(
        (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / (1000 * 60)
      );
      
      this.saveSession(this.currentSession);
      console.log('📊 Analytics: Ended session', this.currentSession.id, 'Duration:', this.currentSession.timeSpent, 'minutes');
      this.currentSession = null;
    }
  }

  // Track suggestion event
  trackSuggestionEvent(
    userId: string,
    documentId: string,
    suggestionId: string,
    suggestionType: SuggestionEvent['suggestionType'],
    severity: SuggestionEvent['severity'],
    action: SuggestionEvent['action'],
    confidence: number
  ): void {
    const event: SuggestionEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      documentId,
      suggestionId,
      suggestionType,
      severity,
      action,
      confidence,
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    // Update current session if active
    if (this.currentSession) {
      if (action === 'applied') {
        this.currentSession.suggestionsApplied++;
        this.currentSession.improvements.push(`${suggestionType}: ${severity}`);
      }
      this.currentSession.suggestionsReceived++;
    }

    this.saveSuggestionEvent(event);
    console.log('📊 Analytics: Tracked suggestion event', action, suggestionType);
  }

  // Update writing progress
  updateWritingProgress(_userId: string, wordCount: number, writingScore: number): void {
    if (this.currentSession) {
      this.currentSession.wordsWritten = wordCount;
      this.currentSession.writingScore = writingScore;
    }
  }

  // Calculate user progress
  async getUserProgress(userId: string): Promise<UserProgress> {
    const sessions = this.getSessions(userId);
    const events = this.getSuggestionEvents(userId);

    const totalSessions = sessions.length;
    const totalWordsWritten = sessions.reduce((sum, s) => sum + s.wordsWritten, 0);
    const totalSuggestionsReceived = sessions.reduce((sum, s) => sum + s.suggestionsReceived, 0);
    const totalSuggestionsApplied = sessions.reduce((sum, s) => sum + s.suggestionsApplied, 0);
    const averageWritingScore = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + s.writingScore, 0) / sessions.length)
      : 0;

    // Calculate improvement areas
    const improvementAreas = this.calculateImprovementAreas(events);
    
    // Calculate weekly progress
    const weeklyProgress = this.calculateWeeklyProgress(sessions);

    // Generate learning goals
    const learningGoals = this.generateLearningGoals(improvementAreas, averageWritingScore);

    return {
      userId,
      totalSessions,
      totalWordsWritten,
      totalSuggestionsReceived,
      totalSuggestionsApplied,
      averageWritingScore,
      improvementAreas,
      weeklyProgress,
      learningGoals
    };
  }

  // Calculate improvement areas
  private calculateImprovementAreas(events: SuggestionEvent[]) {
    const areas = {
      grammar: { received: 0, applied: 0, rate: 0 },
      spelling: { received: 0, applied: 0, rate: 0 },
      style: { received: 0, applied: 0, rate: 0 },
      clarity: { received: 0, applied: 0, rate: 0 }
    };

    events.forEach(event => {
      const area = event.suggestionType;
      if (area in areas) {
        areas[area as keyof typeof areas].received++;
        if (event.action === 'applied') {
          areas[area as keyof typeof areas].applied++;
        }
      }
    });

    // Calculate acceptance rates
    Object.keys(areas).forEach(key => {
      const area = areas[key as keyof typeof areas];
      area.rate = area.received > 0 ? Math.round((area.applied / area.received) * 100) : 0;
    });

    return areas;
  }

  // Calculate weekly progress
  private calculateWeeklyProgress(sessions: WritingSession[]) {
    const weeklyData: { [key: string]: any } = {};
    
    sessions.forEach(session => {
      const week = this.getWeekKey(session.startTime);
      if (!weeklyData[week]) {
        weeklyData[week] = {
          week,
          sessionsCount: 0,
          wordsWritten: 0,
          scores: [],
          improvements: []
        };
      }
      
      weeklyData[week].sessionsCount++;
      weeklyData[week].wordsWritten += session.wordsWritten;
      weeklyData[week].scores.push(session.writingScore);
      weeklyData[week].improvements.push(...session.improvements);
    });

    return Object.values(weeklyData).map((week: any) => ({
      week: week.week,
      sessionsCount: week.sessionsCount,
      wordsWritten: week.wordsWritten,
      averageScore: week.scores.length > 0 
        ? Math.round(week.scores.reduce((a: number, b: number) => a + b, 0) / week.scores.length)
        : 0,
      topImprovements: this.getTopImprovements(week.improvements)
    })).slice(-8); // Last 8 weeks
  }

  // Generate learning goals
  private generateLearningGoals(improvementAreas: any, averageScore: number) {
    const goals = [];

    // Writing score goal
    if (averageScore < 80) {
      goals.push({
        target: 'Achieve 80+ average writing score',
        progress: Math.round((averageScore / 80) * 100),
        achieved: false
      });
    }

    // Grammar improvement goal
    if (improvementAreas.grammar.rate < 70) {
      goals.push({
        target: 'Apply 70% of grammar suggestions',
        progress: improvementAreas.grammar.rate,
        achieved: false
      });
    }

    // Consistency goal
    goals.push({
      target: 'Write 1000 words per week',
      progress: 65, // This would be calculated based on recent activity
      achieved: false
    });

    return goals;
  }

  // Helper methods
  private getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toISOString().split('T')[0];
  }

  private getTopImprovements(improvements: string[]): string[] {
    const counts: { [key: string]: number } = {};
    improvements.forEach(imp => {
      counts[imp] = (counts[imp] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([improvement]) => improvement);
  }

  // Storage methods (using localStorage for now, would be Firebase in production)
  private saveSession(session: WritingSession): void {
    const sessions = this.getSessions(session.userId);
    sessions.push(session);
    localStorage.setItem(`sessions_${session.userId}`, JSON.stringify(sessions));
  }

  private saveSuggestionEvent(event: SuggestionEvent): void {
    const events = this.getSuggestionEvents(event.userId);
    events.push(event);
    localStorage.setItem(`events_${event.userId}`, JSON.stringify(events));
  }

  private getSessions(userId: string): WritingSession[] {
    const stored = localStorage.getItem(`sessions_${userId}`);
    return stored ? JSON.parse(stored) : [];
  }

  private getSuggestionEvents(userId: string): SuggestionEvent[] {
    const stored = localStorage.getItem(`events_${userId}`);
    return stored ? JSON.parse(stored) : [];
  }

  // Get overall usage analytics
  async getUsageAnalytics(): Promise<UsageAnalytics> {
    // This would typically query a database
    // For now, returning mock data structure
    return {
      totalUsers: 1250,
      activeUsers: 340,
      averageSessionTime: 12.5,
      mostCommonSuggestionTypes: [
        { type: 'grammar', count: 2340, rate: 78 },
        { type: 'spelling', count: 1890, rate: 92 },
        { type: 'style', count: 1560, rate: 45 },
        { type: 'clarity', count: 980, rate: 62 }
      ],
      userRetention: {
        daily: 85,
        weekly: 72,
        monthly: 58
      },
      featureUsage: {
        applyAllSuggestions: 890,
        revertSuggestions: 234,
        documentCreation: 1450,
        demoUsage: 2100
      }
    };
  }
}

export const analyticsService = new AnalyticsService(); 