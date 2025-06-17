// AI Writing Assistant Service
// This service provides advanced grammar checking, style suggestions, and writing analysis

export interface Suggestion {
  id: string;
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'conciseness' | 'engagement' | 'tone';
  text: string;
  suggestion: string;
  explanation: string;
  position: { start: number; end: number };
  severity: 'error' | 'warning' | 'suggestion';
  confidence: number;
}

export interface ReadabilityAnalysis {
  fleschScore: number;
  fleschKincaidGrade: number;
  gradeLevel: string;
  readingTime: number;
  complexity: 'easy' | 'medium' | 'hard';
  sentenceCount: number;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
}

export interface WritingStats {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  sentenceCount: number;
  averageWordsPerSentence: number;
  longestSentence: number;
  shortestSentence: number;
  vocabulary: {
    unique: number;
    repeated: string[];
  };
}

export interface ToneAnalysis {
  primary: 'formal' | 'informal' | 'confident' | 'neutral' | 'friendly' | 'academic';
  confidence: number;
  suggestions: string[];
}

class AIWritingService {
  private grammarRules: Array<{
    pattern: RegExp;
    replacement: string;
    type: Suggestion['type'];
    explanation: string;
    severity: Suggestion['severity'];
    confidence: number;
  }> = [
    // Grammar Rules
    {
      pattern: /\bthere is\s+(\w+s)\b/gi,
      replacement: 'there are $1',
      type: 'grammar',
      explanation: 'Subject-verb disagreement: Use "are" with plural nouns',
      severity: 'error',
      confidence: 0.95
    },
    {
      pattern: /\bits\s+own\b/gi,
      replacement: 'its own',
      type: 'grammar',
      explanation: 'Incorrect possessive: Use "its" (possessive) not "it\'s" (contraction)',
      severity: 'error',
      confidence: 0.98
    },
    {
      pattern: /\byour\s+welcome\b/gi,
      replacement: 'you\'re welcome',
      type: 'grammar',
      explanation: 'Incorrect contraction: Use "you\'re" (you are) not "your" (possessive)',
      severity: 'error',
      confidence: 0.97
    },
    {
      pattern: /\bshould\s+of\b/gi,
      replacement: 'should have',
      type: 'grammar',
      explanation: 'Incorrect modal verb: Use "should have" not "should of"',
      severity: 'error',
      confidence: 0.99
    },
    {
      pattern: /\bcould\s+of\b/gi,
      replacement: 'could have',
      type: 'grammar',
      explanation: 'Incorrect modal verb: Use "could have" not "could of"',
      severity: 'error',
      confidence: 0.99
    },
    {
      pattern: /\bwould\s+of\b/gi,
      replacement: 'would have',
      type: 'grammar',
      explanation: 'Incorrect modal verb: Use "would have" not "would of"',
      severity: 'error',
      confidence: 0.99
    },
    {
      pattern: /\ba\s+([aeiou]\w+)/gi,
      replacement: 'an $1',
      type: 'grammar',
      explanation: 'Article error: Use "an" before words starting with vowel sounds',
      severity: 'warning',
      confidence: 0.85
    },
    {
      pattern: /\bwho\s+are\s+(\w+ing)\b/gi,
      replacement: 'who is $1',
      type: 'grammar',
      explanation: 'Subject-verb agreement: Use "who is" with present participle',
      severity: 'warning',
      confidence: 0.8
    },

    // Style Rules
    {
      pattern: /\bvery\s+very\b/gi,
      replacement: 'extremely',
      type: 'style',
      explanation: 'Repetitive intensifier: Replace "very very" with a stronger alternative',
      severity: 'suggestion',
      confidence: 0.9
    },
    {
      pattern: /\breally\s+really\b/gi,
      replacement: 'truly',
      type: 'style',
      explanation: 'Repetitive intensifier: Use a stronger alternative to repeated "really"',
      severity: 'suggestion',
      confidence: 0.9
    },
    {
      pattern: /\bso\s+so\b/gi,
      replacement: 'extremely',
      type: 'style',
      explanation: 'Repetitive intensifier: Use a more precise alternative',
      severity: 'suggestion',
      confidence: 0.85
    },
    {
      pattern: /\bkind\s+of\b/gi,
      replacement: 'somewhat',
      type: 'style',
      explanation: 'Informal language: Consider "somewhat" or "rather" for formal writing',
      severity: 'suggestion',
      confidence: 0.7
    },
    {
      pattern: /\bsort\s+of\b/gi,
      replacement: 'somewhat',
      type: 'style',
      explanation: 'Informal language: Consider "somewhat" or "rather" for formal writing',
      severity: 'suggestion',
      confidence: 0.7
    },

    // Conciseness Rules
    {
      pattern: /\bin\s+order\s+to\b/gi,
      replacement: 'to',
      type: 'conciseness',
      explanation: 'Wordiness: "to" is more concise than "in order to"',
      severity: 'suggestion',
      confidence: 0.9
    },
    {
      pattern: /\bdue\s+to\s+the\s+fact\s+that\b/gi,
      replacement: 'because',
      type: 'conciseness',
      explanation: 'Wordiness: "because" is more direct than "due to the fact that"',
      severity: 'suggestion',
      confidence: 0.95
    },
    {
      pattern: /\bin\s+spite\s+of\s+the\s+fact\s+that\b/gi,
      replacement: 'although',
      type: 'conciseness',
      explanation: 'Wordiness: "although" is more concise than "in spite of the fact that"',
      severity: 'suggestion',
      confidence: 0.9
    },
    {
      pattern: /\bby\s+means\s+of\b/gi,
      replacement: 'by',
      type: 'conciseness',
      explanation: 'Wordiness: "by" is more direct than "by means of"',
      severity: 'suggestion',
      confidence: 0.85
    },
    {
      pattern: /\bfor\s+the\s+purpose\s+of\b/gi,
      replacement: 'to',
      type: 'conciseness',
      explanation: 'Wordiness: "to" is more concise than "for the purpose of"',
      severity: 'suggestion',
      confidence: 0.9
    },

    // Clarity Rules
    {
      pattern: /\bwhich\s+is\s+(\w+)\b/gi,
      replacement: '$1',
      type: 'clarity',
      explanation: 'Clarity: Consider removing "which is" for more direct writing',
      severity: 'suggestion',
      confidence: 0.75
    },
    {
      pattern: /\bthat\s+is\s+to\s+say\b/gi,
      replacement: 'namely',
      type: 'clarity',
      explanation: 'Clarity: "namely" is more direct than "that is to say"',
      severity: 'suggestion',
      confidence: 0.8
    },
    {
      pattern: /\bin\s+other\s+words\b/gi,
      replacement: 'specifically',
      type: 'clarity',
      explanation: 'Clarity: Consider "specifically" or "namely" for clearer expression',
      severity: 'suggestion',
      confidence: 0.7
    },

    // Engagement Rules
    {
      pattern: /\bI\s+think\s+that\b/gi,
      replacement: 'I believe',
      type: 'engagement',
      explanation: 'Confidence: "I believe" sounds more confident than "I think that"',
      severity: 'suggestion',
      confidence: 0.6
    },
    {
      pattern: /\bmaybe\s+we\s+should\b/gi,
      replacement: 'we should consider',
      type: 'engagement',
      explanation: 'Confidence: More assertive phrasing engages readers better',
      severity: 'suggestion',
      confidence: 0.65
    }
  ];

  private spellingErrors: Array<{ wrong: string; right: string; confidence: number }> = [
    { wrong: 'recieve', right: 'receive', confidence: 0.99 },
    { wrong: 'seperate', right: 'separate', confidence: 0.99 },
    { wrong: 'definately', right: 'definitely', confidence: 0.99 },
    { wrong: 'occured', right: 'occurred', confidence: 0.99 },
    { wrong: 'neccessary', right: 'necessary', confidence: 0.99 },
    { wrong: 'accomodate', right: 'accommodate', confidence: 0.99 },
    { wrong: 'achievment', right: 'achievement', confidence: 0.99 },
    { wrong: 'beleive', right: 'believe', confidence: 0.99 },
    { wrong: 'concieve', right: 'conceive', confidence: 0.99 },
    { wrong: 'decieve', right: 'deceive', confidence: 0.99 },
    { wrong: 'existance', right: 'existence', confidence: 0.99 },
    { wrong: 'independant', right: 'independent', confidence: 0.99 },
    { wrong: 'persistance', right: 'persistence', confidence: 0.99 },
    { wrong: 'preperation', right: 'preparation', confidence: 0.99 },
    { wrong: 'recomend', right: 'recommend', confidence: 0.99 },
    { wrong: 'resistence', right: 'resistance', confidence: 0.99 },
    { wrong: 'responsability', right: 'responsibility', confidence: 0.99 },
    { wrong: 'temperture', right: 'temperature', confidence: 0.99 },
    { wrong: 'tommorrow', right: 'tomorrow', confidence: 0.99 },
    { wrong: 'untill', right: 'until', confidence: 0.99 }
  ];

  // Analyze text for grammar, spelling, and style issues
  public async analyzeText(text: string): Promise<{
    suggestions: Suggestion[];
    readability: ReadabilityAnalysis;
    stats: WritingStats;
    tone: ToneAnalysis;
  }> {
    if (!text.trim()) {
      return {
        suggestions: [],
        readability: this.calculateReadability(''),
        stats: this.calculateStats(''),
        tone: this.analyzeTone('')
      };
    }

    const suggestions: Suggestion[] = [];
    let suggestionId = 0;

    // Apply grammar and style rules
    this.grammarRules.forEach(rule => {
      let match;
      rule.pattern.lastIndex = 0; // Reset regex
      while ((match = rule.pattern.exec(text)) !== null) {
        suggestions.push({
          id: `suggestion-${suggestionId++}`,
          type: rule.type,
          text: match[0],
          suggestion: match[0].replace(rule.pattern, rule.replacement),
          explanation: rule.explanation,
          position: { start: match.index, end: match.index + match[0].length },
          severity: rule.severity,
          confidence: rule.confidence
        });
      }
    });

    // Check for spelling errors
    this.spellingErrors.forEach(error => {
      const regex = new RegExp(`\\b${error.wrong}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        suggestions.push({
          id: `spelling-${suggestionId++}`,
          type: 'spelling',
          text: match[0],
          suggestion: error.right,
          explanation: `Spelling correction: "${error.wrong}" should be "${error.right}"`,
          position: { start: match.index, end: match.index + match[0].length },
          severity: 'error',
          confidence: error.confidence
        });
      }
    });

    // Check for passive voice
    const passiveVoicePattern = /\b(am|is|are|was|were|being|been|be)\s+([\w]+ed|[\w]+en)\b/gi;
    let passiveMatch;
    while ((passiveMatch = passiveVoicePattern.exec(text)) !== null) {
      suggestions.push({
        id: `passive-${suggestionId++}`,
        type: 'style',
        text: passiveMatch[0],
        suggestion: 'Consider active voice',
        explanation: 'Passive voice can make writing less engaging. Consider using active voice for clearer, more direct communication.',
        position: { start: passiveMatch.index, end: passiveMatch.index + passiveMatch[0].length },
        severity: 'suggestion',
        confidence: 0.7
      });
    }

    // Check for long sentences (over 25 words)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    sentences.forEach((sentence) => {
      const words = sentence.trim().split(/\s+/).length;
      if (words > 25) {
        const sentenceStart = text.indexOf(sentence.trim());
        if (sentenceStart !== -1) {
          suggestions.push({
            id: `long-sentence-${suggestionId++}`,
            type: 'clarity',
            text: sentence.trim(),
            suggestion: 'Consider breaking into shorter sentences',
            explanation: `This sentence has ${words} words. Consider breaking it into shorter sentences for better readability.`,
            position: { start: sentenceStart, end: sentenceStart + sentence.trim().length },
            severity: 'suggestion',
            confidence: 0.8
          });
        }
      }
    });

    // Calculate all analyses
    const readability = this.calculateReadability(text);
    const stats = this.calculateStats(text);
    const tone = this.analyzeTone(text);

    // Sort suggestions by confidence and severity
    suggestions.sort((a, b) => {
      const severityWeight = { error: 3, warning: 2, suggestion: 1 };
      const aSeverity = severityWeight[a.severity];
      const bSeverity = severityWeight[b.severity];
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }
      return b.confidence - a.confidence;
    });

    return {
      suggestions,
      readability,
      stats,
      tone
    };
  }

  // Calculate readability metrics
  private calculateReadability(text: string): ReadabilityAnalysis {
    if (!text.trim()) {
      return {
        fleschScore: 100,
        fleschKincaidGrade: 0,
        gradeLevel: 'Elementary',
        readingTime: 0,
        complexity: 'easy',
        sentenceCount: 0,
        averageWordsPerSentence: 0,
        averageSyllablesPerWord: 0
      };
    }

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(text);

    const sentenceCount = sentences.length;
    const wordCount = words.length;
    const syllableCount = syllables;

    const averageWordsPerSentence = wordCount / sentenceCount;
    const averageSyllablesPerWord = syllableCount / wordCount;

    // Flesch Reading Ease Score
    const fleschScore = Math.max(0, Math.min(100, 
      206.835 - (1.015 * averageWordsPerSentence) - (84.6 * averageSyllablesPerWord)
    ));

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade = Math.max(0,
      (0.39 * averageWordsPerSentence) + (11.8 * averageSyllablesPerWord) - 15.59
    );

    // Determine grade level and complexity
    let gradeLevel = 'Graduate';
    let complexity: 'easy' | 'medium' | 'hard' = 'hard';

    if (fleschScore >= 90) {
      gradeLevel = 'Elementary';
      complexity = 'easy';
    } else if (fleschScore >= 80) {
      gradeLevel = 'Middle School';
      complexity = 'easy';
    } else if (fleschScore >= 70) {
      gradeLevel = 'High School';
      complexity = 'medium';
    } else if (fleschScore >= 60) {
      gradeLevel = 'College';
      complexity = 'medium';
    } else if (fleschScore >= 50) {
      gradeLevel = 'Graduate';
      complexity = 'hard';
    }

    // Reading time (average 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);

    return {
      fleschScore: Math.round(fleschScore),
      fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
      gradeLevel,
      readingTime,
      complexity,
      sentenceCount,
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
      averageSyllablesPerWord: Math.round(averageSyllablesPerWord * 10) / 10
    };
  }

  // Count syllables in text
  private countSyllables(text: string): number {
    return text.toLowerCase()
      .split(/\s+/)
      .reduce((count, word) => {
        const syllableCount = word
          .replace(/[^a-z]/gi, '')
          .replace(/e$/, '')
          .match(/[aeiouy]+/g);
        return count + Math.max(1, syllableCount?.length || 1);
      }, 0);
  }

  // Calculate writing statistics
  private calculateStats(text: string): WritingStats {
    if (!text.trim()) {
      return {
        wordCount: 0,
        characterCount: 0,
        paragraphCount: 0,
        sentenceCount: 0,
        averageWordsPerSentence: 0,
        longestSentence: 0,
        shortestSentence: 0,
        vocabulary: { unique: 0, repeated: [] }
      };
    }

    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    const wordCount = words.length;
    const characterCount = text.length;
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;

    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const averageWordsPerSentence = wordCount / sentenceCount || 0;
    const longestSentence = Math.max(...sentenceLengths, 0);
    const shortestSentence = Math.min(...sentenceLengths, 0);

    // Vocabulary analysis
    const wordFrequency: { [key: string]: number } = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 3) { // Only consider words longer than 3 characters
        wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
      }
    });

    const uniqueWords = Object.keys(wordFrequency).length;
    const repeatedWords = Object.entries(wordFrequency)
      .filter(([_, count]) => count > 2)
      .map(([word, _]) => word)
      .slice(0, 10); // Top 10 most repeated words

    return {
      wordCount,
      characterCount,
      paragraphCount,
      sentenceCount,
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
      longestSentence,
      shortestSentence,
      vocabulary: {
        unique: uniqueWords,
        repeated: repeatedWords
      }
    };
  }

  // Analyze tone of writing
  private analyzeTone(text: string): ToneAnalysis {
    if (!text.trim()) {
      return {
        primary: 'neutral',
        confidence: 0,
        suggestions: []
      };
    }

    const lowerText = text.toLowerCase();
    
    // Tone indicators
    const tonePatterns = {
      formal: [
        /\b(therefore|furthermore|however|moreover|consequently|nevertheless)\b/g,
        /\b(shall|ought|must)\b/g,
        /\b(in conclusion|in summary|to summarize)\b/g
      ],
      informal: [
        /\b(gonna|wanna|kinda|sorta|yeah|ok|okay)\b/g,
        /\b(awesome|cool|great|amazing)\b/g,
        /[!]{2,}/g // Multiple exclamation marks
      ],
      confident: [
        /\b(certainly|definitely|absolutely|undoubtedly|clearly)\b/g,
        /\b(will|shall|must)\b/g,
        /\b(proven|demonstrated|established)\b/g
      ],
      friendly: [
        /\b(thanks|please|appreciate|welcome|glad)\b/g,
        /\b(hope|wish|looking forward)\b/g,
        /😊|😄|😃|🙂/g // Emoji patterns
      ],
      academic: [
        /\b(analyze|hypothesis|methodology|empirical|theoretical)\b/g,
        /\b(research|study|investigation|examination)\b/g,
        /\b(according to|as stated by|references indicate)\b/g
      ]
    };

    // Count matches for each tone
    const toneScores: { [key: string]: number } = {
      formal: 0,
      informal: 0,
      confident: 0,
      friendly: 0,
      academic: 0,
      neutral: 1 // Default baseline
    };

    Object.entries(tonePatterns).forEach(([tone, patterns]) => {
      patterns.forEach(pattern => {
        const matches = lowerText.match(pattern);
        if (matches) {
          toneScores[tone] += matches.length;
        }
      });
    });

    // Find primary tone
    const primaryTone = Object.entries(toneScores)
      .sort(([,a], [,b]) => b - a)[0][0] as ToneAnalysis['primary'];

    const maxScore = Math.max(...Object.values(toneScores));
    const confidence = Math.min(maxScore / 10, 1); // Normalize confidence

    // Generate suggestions based on tone
    const suggestions: string[] = [];
    
    if (primaryTone === 'informal' && confidence > 0.5) {
      suggestions.push('Consider using more formal language for professional writing');
    }
    
    if (primaryTone === 'formal' && confidence > 0.7) {
      suggestions.push('Your writing has a formal tone, which is great for professional contexts');
    }
    
    if (confidence < 0.3) {
      suggestions.push('Try to establish a clearer tone that matches your audience and purpose');
    }

    return {
      primary: primaryTone,
      confidence: Math.round(confidence * 100) / 100,
      suggestions
    };
  }

  // Quick grammar check for real-time feedback
  public async quickCheck(text: string): Promise<Suggestion[]> {
    const analysis = await this.analyzeText(text);
    return analysis.suggestions.filter(s => s.severity === 'error').slice(0, 5);
  }

  // Get writing score (0-100)
  public getWritingScore(
    suggestions: Suggestion[], 
    readability: ReadabilityAnalysis,
    wordCount: number
  ): { score: number; factors: string[] } {
    let score = 100;
    const factors: string[] = [];

    // Deduct points for errors
    const errors = suggestions.filter(s => s.severity === 'error').length;
    const warnings = suggestions.filter(s => s.severity === 'warning').length;
    const suggestions_count = suggestions.filter(s => s.severity === 'suggestion').length;

    score -= errors * 10;
    score -= warnings * 5;
    score -= suggestions_count * 2;

    if (errors > 0) factors.push(`${errors} grammar/spelling errors`);
    if (warnings > 0) factors.push(`${warnings} style warnings`);

    // Readability factors
    if (readability.complexity === 'hard') {
      score -= 10;
      factors.push('Complex readability');
    } else if (readability.complexity === 'easy') {
      score += 5;
      factors.push('Clear and readable');
    }

    // Length factors
    if (wordCount < 50) {
      score -= 15;
      factors.push('Very short content');
    } else if (wordCount > 500) {
      score += 5;
      factors.push('Substantial content');
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      factors
    };
  }
}

// Export singleton instance
export const aiWritingService = new AIWritingService();
export default aiWritingService;
