import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { openaiService } from './services/openaiService';
import LandingPage from './components/LandingPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import SupportPage from './components/SupportPage';
import AuthModal from './components/AuthModal';
import FirebaseDebug from './components/FirebaseDebug';

// Firebase imports
import { onAuthStateChange, signInWithGoogle, signInWithEmail, signUpWithEmail, signOutUser } from './firebase/auth';
import { getUserDocuments } from './firebase/documents';
import type { User as FirebaseUser } from './firebase/auth';

// Types (keeping local User interface for offline mode compatibility)

interface Document {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'essay' | 'email' | 'article' | 'presentation' | 'other';
  wordCount: number;
  status: 'draft' | 'reviewing' | 'final';
  createdAt: Date;
  updatedAt: Date;
}

interface Suggestion {
  id: string;
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'conciseness' | 'engagement' | 'tone';
  text: string;
  suggestion: string;
  explanation: string;
  position: { start: number; end: number };
  severity: 'error' | 'warning' | 'suggestion';
  confidence?: number;
}

interface ReadabilityStats {
  fleschScore: number;
  gradeLevel: string;
  readingTime: number;
  complexity: 'easy' | 'medium' | 'hard';
}

interface WritingStats {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  averageWordsPerSentence: number;
}

interface WritingScore {
  score: number;
  factors: string[];
}

function App() {
  // Firebase Authentication State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [readabilityStats, setReadabilityStats] = useState<ReadabilityStats | null>(null);
  const [writingStats, setWritingStats] = useState<WritingStats | null>(null);
  const [writingScore, setWritingScore] = useState<WritingScore | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeView, setActiveView] = useState<'editor' | 'documents'>('editor');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [currentPage, setCurrentPage] = useState<'landing' | 'privacy' | 'terms' | 'support' | 'app'>('landing');
  const [showFirebaseDebug, setShowFirebaseDebug] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Firebase Auth State Listener
  useEffect(() => {
    console.log('🔄 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      console.log('👤 Auth state changed:', firebaseUser ? firebaseUser.email : 'signed out');
      setUser(firebaseUser);
      setAuthLoading(false);
      
      if (firebaseUser) {
        // User is signed in
        console.log('✅ User authenticated, navigating to app and loading documents...');
        setShowAuthModal(false);
        setIsDemoMode(false); // Exit demo mode when user signs in
        setCurrentPage('app'); // Navigate to the app after sign-in
        loadUserDocuments(firebaseUser.id);
      } else {
        // User is signed out, use offline mode
        console.log('📱 User not authenticated, initializing offline mode...');
        setCurrentPage('landing'); // Return to landing page when signed out
        initializeOfflineMode();
      }
    });

    return () => {
      console.log('🔄 Cleaning up auth listener...');
      unsubscribe();
    };
  }, []);

  // Initialize with default document for offline mode
  const initializeOfflineMode = () => {
    const defaultDoc: Document = {
      id: 'default-doc',
      userId: 'offline-user',
      title: 'My Document',
      content: '',
      type: 'other',
      wordCount: 0,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCurrentDoc(defaultDoc);
    setDocuments([defaultDoc]);
  };

  // Initialize offline mode on first load
  useEffect(() => {
    if (!authLoading && !user) {
      initializeOfflineMode();
    }
  }, [authLoading, user]);

  // Load user documents from Firebase
  const loadUserDocuments = async (userId: string) => {
    try {
      const userDocs = await getUserDocuments(userId);
      const convertedDocs: Document[] = userDocs.map(doc => ({
        id: doc.id,
        userId: doc.userId,
        title: doc.title,
        content: doc.content,
        type: doc.type,
        wordCount: doc.wordCount,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }));
      setDocuments(convertedDocs);
      
      if (convertedDocs.length > 0) {
        // User has existing documents, open the first one
        setCurrentDoc(convertedDocs[0]);
        setActiveView('editor');
        console.log('📝 Loaded existing document:', convertedDocs[0].title);
      } else {
        // New user with no documents, create a fresh document
        console.log('📝 No existing documents found, creating new document for new user');
        const newDoc: Document = {
          id: `doc-${Date.now()}`,
          userId: userId,
          title: 'Welcome to WordWise',
          content: 'Start writing your document here...',
          type: 'other',
          wordCount: 0,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setCurrentDoc(newDoc);
        setDocuments([newDoc]);
        setActiveView('editor');
      }
    } catch (error) {
      console.error('Error loading user documents:', error);
      // Fallback: create a new document even if loading fails
      const fallbackDoc: Document = {
        id: `doc-${Date.now()}`,
        userId: userId,
        title: 'My Document',
        content: '',
        type: 'other',
        wordCount: 0,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setCurrentDoc(fallbackDoc);
      setDocuments([fallbackDoc]);
      setActiveView('editor');
    }
  };

  // Text analysis function with AI integration and local fallback
  const analyzeText = async (text: string) => {
    try {
      console.log('🔍 Starting text analysis for:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
      
      if (!text.trim()) {
        console.log('📝 Empty text, returning default values');
              return {
        suggestions: [],
        readabilityStats: {
          fleschScore: 100,
          gradeLevel: 'Elementary',
          readingTime: 0,
          complexity: 'easy' as const
        },
        writingStats: {
          wordCount: 0,
          characterCount: 0,
          sentenceCount: 0,
          averageWordsPerSentence: 0
        },
        writingScore: {
          score: 100,
          factors: ['No text to analyze']
        }
      };
      }

      // For debugging: Force local analysis to run
      console.log('🔄 Using local regex-based analysis for debugging...');
      const localResult = performLocalAnalysis(text);
      
      // Also try AI analysis but use local as primary for now
      try {
        console.log('🤖 Also attempting AI analysis...');
        const aiResult = await openaiService.analyzeText(text);
        if (aiResult && aiResult.suggestions.length > 0) {
          console.log('✅ AI analysis found', aiResult.suggestions.length, 'additional suggestions');
          // Merge AI and local suggestions for debugging
          return {
            ...localResult,
            suggestions: [...localResult.suggestions, ...aiResult.suggestions]
          };
        }
      } catch (error) {
        console.log('⚠️ AI analysis failed:', error);
      }

      console.log('📋 Using local analysis result with', localResult.suggestions.length, 'suggestions');
      return localResult;

    } catch (error) {
      console.error('❌ Critical error in text analysis:', error);
      // Return safe fallback
      return {
        suggestions: [],
        readabilityStats: {
          fleschScore: 100,
          gradeLevel: 'Elementary',
          readingTime: 0,
          complexity: 'easy' as const
        },
        writingStats: {
          wordCount: 0,
          characterCount: 0,
          sentenceCount: 0,
          averageWordsPerSentence: 0
        },
        writingScore: {
          score: 100,
          factors: ['Analysis error - safe mode']
        }
      };
    }
  };

  // Local regex-based analysis (fallback)
  const performLocalAnalysis = (text: string) => {
    try {
      console.log('🔍 Starting grammar checks...');
      // Process grammar checks
      const grammarChecks = [
        {
          find: /\bthere is (\w+s)\b/gi,
          replace: 'there are $1',
          type: 'grammar' as const,
          explanation: 'Subject-verb disagreement: Use "are" with plural nouns',
          severity: 'error' as const
        },
        {
          find: /\byour welcome\b/gi,
          replace: 'you\'re welcome',
          type: 'grammar' as const,
          explanation: 'Use "you\'re" (you are) not "your" (possessive)',
          severity: 'error' as const
        },
        {
          find: /\bshould of\b/gi,
          replace: 'should have',
          type: 'grammar' as const,
          explanation: 'Use "should have" not "should of"',
          severity: 'error' as const
        },
        {
          find: /\b(i)\b/g,
          replace: 'I',
          type: 'grammar' as const,
          explanation: 'The pronoun "I" should always be capitalized',
          severity: 'warning' as const
        }
      ];

      console.log('🔍 Starting spelling checks...');
      // Process spelling checks
      const spellingChecks = [
        // Common "i before e" errors
        { find: /\brecieve\b/gi, replace: 'receive', explanation: 'Spelling: "receive" follows "i before e except after c"' },
        { find: /\bacheive\b/gi, replace: 'achieve', explanation: 'Spelling: "achieve" follows "i before e except after c"' },
        { find: /\bbeleive\b/gi, replace: 'believe', explanation: 'Spelling: "believe" follows "i before e except after c"' },
        { find: /\bconceive\b/gi, replace: 'conceive', explanation: 'Spelling: "conceive" follows "i before e except after c"' },
        
        // Double letter confusions
        { find: /\bseperate\b/gi, replace: 'separate', explanation: 'Spelling: "separate" has "a" in the middle' },
        { find: /\bdefinately\b/gi, replace: 'definitely', explanation: 'Spelling: "definitely" ends with "-itely"' },
        { find: /\boccured\b/gi, replace: 'occurred', explanation: 'Spelling: "occurred" has double "r"' },
        { find: /\boccurence\b/gi, replace: 'occurrence', explanation: 'Spelling: "occurrence" has double "r" and "c"' },
        { find: /\baccomodate\b/gi, replace: 'accommodate', explanation: 'Spelling: "accommodate" has double "m"' },
        { find: /\bneccessary\b/gi, replace: 'necessary', explanation: 'Spelling: "necessary" has one "c" and two "s"' },
        { find: /\bpossesion\b/gi, replace: 'possession', explanation: 'Spelling: "possession" has double "s"' },
        { find: /\bprofesional\b/gi, replace: 'professional', explanation: 'Spelling: "professional" has double "s"' },
        
        // -ment vs -ement
        { find: /\bachievment\b/gi, replace: 'achievement', explanation: 'Spelling: "achievement" has "e" before "ment"' },
        { find: /\bjudgement\b/gi, replace: 'judgment', explanation: 'Spelling: American English uses "judgment" without "e"' },
        { find: /\backnowledgement\b/gi, replace: 'acknowledgment', explanation: 'Spelling: American English uses "acknowledgment" without "e"' },
        
        // Common word endings
        { find: /\benviroment\b/gi, replace: 'environment', explanation: 'Spelling: "environment" has "n" before "ment"' },
        { find: /\bgovernment\b/gi, replace: 'government', explanation: 'Spelling: "government" has "n" before "ment"' },
        { find: /\bdevelopement\b/gi, replace: 'development', explanation: 'Spelling: "development" has no "e" before "ment"' },
        
        // Commonly misspelled words
        { find: /\btommorow\b/gi, replace: 'tomorrow', explanation: 'Spelling: "tomorrow" has one "m"' },
        { find: /\btommorrow\b/gi, replace: 'tomorrow', explanation: 'Spelling: "tomorrow" has one "m"' },
        { find: /\buntill\b/gi, replace: 'until', explanation: 'Spelling: "until" has one "l"' },
        { find: /\bwierd\b/gi, replace: 'weird', explanation: 'Spelling: "weird" is an exception to "i before e"' },
        { find: /\bfreinds\b/gi, replace: 'friends', explanation: 'Spelling: "friends" follows "i before e except after c"' },
        { find: /\bbeginning\b/gi, replace: 'beginning', explanation: 'Spelling: "beginning" has double "n"' },
        { find: /\bcommittee\b/gi, replace: 'committee', explanation: 'Spelling: "committee" has double "m" and "t"' },
        { find: /\bmispell\b/gi, replace: 'misspell', explanation: 'Spelling: "misspell" has double "s"' },
        { find: /\bmispelled\b/gi, replace: 'misspelled', explanation: 'Spelling: "misspelled" has double "s"' },
        
        // Homophones and confusing words
        { find: /\bthere own\b/gi, replace: 'their own', explanation: 'Spelling: Use "their" (possessive) not "there" (location)' },
        { find: /\bthier\b/gi, replace: 'their', explanation: 'Spelling: "their" has "e" before "i"' },
        
        // Technology and modern words
        { find: /\bwebsite\b/gi, replace: 'website', explanation: 'Spelling: "website" is one word' },
        { find: /\bemail\b/gi, replace: 'email', explanation: 'Spelling: "email" is typically one word' },
        
        // Double checking some variants
        { find: /\balot\b/gi, replace: 'a lot', explanation: 'Spelling: "a lot" is two words' },
        { find: /\ballot\b/gi, replace: 'a lot', explanation: 'Spelling: "a lot" is two words (unless you mean voting ballot)' },
        { find: /\bthru\b/gi, replace: 'through', explanation: 'Spelling: Use "through" in formal writing, not "thru"' },
        { find: /\brite\b/gi, replace: 'right', explanation: 'Spelling: Use "right" not "rite" (unless referring to a ceremony)' },
        
        // Additional common misspellings
        { find: /\binterupt\b/gi, replace: 'interrupt', explanation: 'Spelling: "interrupt" has double "r"' },
        { find: /\bsimiliar\b/gi, replace: 'similar', explanation: 'Spelling: "similar" ends with "-ar"' },
        { find: /\bwritting\b/gi, replace: 'writing', explanation: 'Spelling: "writing" has one "t"' },
        { find: /\bcomming\b/gi, replace: 'coming', explanation: 'Spelling: "coming" has one "m"' },
        { find: /\bruning\b/gi, replace: 'running', explanation: 'Spelling: "running" has double "n"' },
        { find: /\bstoping\b/gi, replace: 'stopping', explanation: 'Spelling: "stopping" has double "p"' },
        { find: /\bgeting\b/gi, replace: 'getting', explanation: 'Spelling: "getting" has double "t"' },
        { find: /\bputing\b/gi, replace: 'putting', explanation: 'Spelling: "putting" has double "t"' },
        { find: /\bsiting\b/gi, replace: 'sitting', explanation: 'Spelling: "sitting" has double "t"' },
        { find: /\bfiting\b/gi, replace: 'fitting', explanation: 'Spelling: "fitting" has double "t"' },
        { find: /\bcuting\b/gi, replace: 'cutting', explanation: 'Spelling: "cutting" has double "t"' },
        { find: /\bhiting\b/gi, replace: 'hitting', explanation: 'Spelling: "hitting" has double "t"' },
        { find: /\bbegining\b/gi, replace: 'beginning', explanation: 'Spelling: "beginning" has double "n"' },
        { find: /\bwining\b/gi, replace: 'winning', explanation: 'Spelling: "winning" has double "n"' },
        { find: /\bplaning\b/gi, replace: 'planning', explanation: 'Spelling: "planning" has double "n"' },
        { find: /\bsining\b/gi, replace: 'singing', explanation: 'Spelling: "singing" has "g"' },
        
        // Very common typos
        { find: /\bteh\b/gi, replace: 'the', explanation: 'Spelling: "the" - common typo' },
        { find: /\badn\b/gi, replace: 'and', explanation: 'Spelling: "and" - common typo' },
        { find: /\bspeling\b/gi, replace: 'spelling', explanation: 'Spelling: "spelling" has double "l"' }
      ];

      const suggestions: Suggestion[] = [];
      let suggestionId = 0;

      // Process grammar checks
      grammarChecks.forEach(check => {
        try {
          const matches = Array.from(text.matchAll(check.find));
          if (matches.length > 0) {
            console.log(`✅ Grammar match found:`, matches.length, 'instances of', check.find);
          }
          matches.forEach(match => {
            if (match.index !== undefined) {
              const replacement = match[0].replace(check.find, check.replace);
              suggestions.push({
                id: `grammar-${suggestionId++}`,
                type: check.type,
                text: match[0],
                suggestion: replacement,
                explanation: check.explanation,
                position: { start: match.index, end: match.index + match[0].length },
                severity: check.severity,
                confidence: 0.95
              });
            }
          });
        } catch (error) {
          console.error('Error processing grammar check:', error);
        }
      });

      // Process spelling checks
      spellingChecks.forEach(check => {
        try {
          const matches = Array.from(text.matchAll(check.find));
          if (matches.length > 0) {
            console.log(`✅ Spelling match found:`, matches.length, 'instances of', check.find);
          }
          matches.forEach(match => {
            if (match.index !== undefined) {
              const replacement = match[0].replace(check.find, check.replace);
              suggestions.push({
                id: `spelling-${suggestionId++}`,
                type: 'spelling',
                text: match[0],
                suggestion: replacement,
                explanation: check.explanation,
                position: { start: match.index, end: match.index + match[0].length },
                severity: 'error',
                confidence: 0.99
              });
            }
          });
        } catch (error) {
          console.error('Error processing spelling check:', error);
        }
      });

      // Check for capitalization issues
      if (text.trim().length > 0) {
        const firstChar = text.trim().charAt(0);
        if (firstChar >= 'a' && firstChar <= 'z') {
          suggestions.push({
            id: `capitalization-${suggestionId++}`,
            type: 'grammar',
            text: `"${firstChar}"`,
            suggestion: `"${firstChar.toUpperCase()}"`,
            explanation: 'Sentences should start with a capital letter',
            position: { start: 0, end: 1 },
            severity: 'warning',
            confidence: 0.95
          });
        }
      }

      // Check for proper name capitalization (common names)
      const commonNames = ['abdullah', 'mirza', 'ahmed', 'ali', 'mohammed', 'hassan', 'hussain', 'khan', 'shah', 'malik'];
      const textWords = text.split(/\s+/);
      
      textWords.forEach((word) => {
        const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
        if (commonNames.includes(cleanWord) && word.charAt(0) === word.charAt(0).toLowerCase()) {
          const wordStart = text.indexOf(word);
          if (wordStart !== -1) {
            suggestions.push({
              id: `name-cap-${suggestionId++}`,
              type: 'grammar',
              text: `"${word}"`,
              suggestion: `"${word.charAt(0).toUpperCase() + word.slice(1)}"`,
              explanation: 'Names should be capitalized',
              position: { start: wordStart, end: wordStart + word.length },
              severity: 'warning',
              confidence: 0.9
            });
          }
        }
      });

      // Check for "i" pronoun capitalization
      const iPattern = /\bi\b/g;
      let iMatch;
      while ((iMatch = iPattern.exec(text)) !== null) {
        suggestions.push({
          id: `i-cap-${suggestionId++}`,
          type: 'grammar',
          text: '"i"',
          suggestion: '"I"',
          explanation: 'The pronoun "I" should always be capitalized',
          position: { start: iMatch.index, end: iMatch.index + 1 },
          severity: 'warning',
          confidence: 0.98
        });
      }

      // Check for missing punctuation at the end
      if (text.trim().length > 0) {
        const trimmedText = text.trim();
        const lastChar = trimmedText.slice(-1);
        if (lastChar !== '.' && lastChar !== '!' && lastChar !== '?') {
          suggestions.push({
            id: `punctuation-${suggestionId++}`,
            type: 'grammar',
            text: 'Add period',
            suggestion: trimmedText + '.',
            explanation: 'Sentences should end with proper punctuation',
            position: { start: trimmedText.length, end: trimmedText.length },
            severity: 'suggestion',
            confidence: 0.85
          });
        }
      }

      // Check for missing commas in compound sentences
      // Pattern: "word I verb" should be "word, I verb"
      const compoundPattern = /(\w+)\s+(I)\s+(hope|think|believe|know|feel|wish)/g;
      let commaMatch;
      while ((commaMatch = compoundPattern.exec(text)) !== null) {
        const beforeWord = commaMatch[1];
        const fullMatch = commaMatch[0];
        const replacement = fullMatch.replace(/(\w+)\s+(I)\s+/, `${beforeWord}, I `);
        
        suggestions.push({
          id: `comma-${suggestionId++}`,
          type: 'grammar',
          text: fullMatch,
          suggestion: replacement,
          explanation: 'Add a comma before independent clauses starting with "I"',
          position: { start: commaMatch.index, end: commaMatch.index + fullMatch.length },
          severity: 'warning',
          confidence: 0.9
        });
      }

      // Check for specific patterns
      if (text.toLowerCase().includes('hi my name is')) {
        suggestions.push({
          id: `formality-${suggestionId++}`,
          type: 'style',
          text: 'hi my name is',
          suggestion: 'Hello, my name is',
          explanation: 'Consider using "Hello" instead of "hi" for more formal writing',
          position: { start: 0, end: 13 },
          severity: 'suggestion',
          confidence: 0.8
        });
      }

      console.log('📊 Total suggestions found:', suggestions.length);

      // Calculate readability
      const words = text.trim().split(/\s+/).filter(w => w.length > 0);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const wordCount = words.length;
      const sentenceCount = sentences.length || 1;

      // Simple Flesch score calculation
      const avgWordsPerSentence = wordCount / sentenceCount;
      let fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * 1.5); // Simplified syllable calculation
      
      // Ensure we have valid numbers
      if (isNaN(fleschScore) || !isFinite(fleschScore)) {
        fleschScore = 70; // Default to moderate score
      }
      
      fleschScore = Math.max(0, Math.min(100, fleschScore));

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
      }

      const readabilityStats: ReadabilityStats = {
        fleschScore: Math.round(fleschScore),
        gradeLevel,
        readingTime: Math.max(1, Math.round(wordCount / 200)), // 200 words per minute
        complexity
      };

      const writingStats: WritingStats = {
        wordCount,
        characterCount: text.length,
        sentenceCount,
        averageWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10
      };

      let baseScore = fleschScore + (suggestions.length === 0 ? 20 : -suggestions.length * 2);
      
      // Ensure base score is valid
      if (isNaN(baseScore) || !isFinite(baseScore)) {
        baseScore = 70; // Default score
      }
      
      const finalScore = Math.max(60, Math.min(100, Math.round(baseScore)));
      
      console.log('📊 Score calculation:', {
        fleschScore,
        suggestionsCount: suggestions.length,
        baseScore,
        finalScore
      });

      const writingScore: WritingScore = {
        score: finalScore,
        factors: suggestions.length === 0 ? ['Good grammar', 'Clear writing'] : ['Grammar issues found', 'Spelling corrections needed']
      };

      console.log('✅ Local analysis completed successfully. Final score:', writingScore.score);
      return {
        suggestions,
        readabilityStats,
        writingStats,
        writingScore
      };

    } catch (error) {
      console.error('❌ Error in local analysis:', error);
      return {
        suggestions: [],
        readabilityStats: {
          fleschScore: 70,
          gradeLevel: 'High School',
          readingTime: 1,
          complexity: 'medium' as const
        },
        writingStats: {
          wordCount: 0,
          characterCount: 0,
          sentenceCount: 0,
          averageWordsPerSentence: 0
        },
        writingScore: {
          score: 70,
          factors: ['Analysis error - using safe defaults']
        }
      };
    }
  };

  // Handle text changes with real-time analysis
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentDoc) return;

    const newContent = e.target.value;
    const wordCount = newContent.trim().split(/\s+/).filter(w => w.length > 0).length;

    // Update document immediately
    const updatedDoc = {
      ...currentDoc,
      content: newContent,
      wordCount,
      updatedAt: new Date()
    };
    setCurrentDoc(updatedDoc);

    // Real-time analysis with debouncing
    if (newContent.length > 5) {
      setIsAnalyzing(true);
      setTimeout(async () => {
        try {
          const analysis = await analyzeText(newContent);
          setSuggestions(analysis.suggestions);
          setReadabilityStats(analysis.readabilityStats);
          setWritingStats(analysis.writingStats);
          setWritingScore(analysis.writingScore);
        } catch (error) {
          console.error('Error during analysis:', error);
          setSuggestions([]);
          setReadabilityStats(null);
          setWritingStats(null);
          setWritingScore(null);
        } finally {
          setIsAnalyzing(false);
        }
      }, 500);
    } else {
      setSuggestions([]);
      setReadabilityStats(null);
      setWritingStats(null);
      setWritingScore(null);
      setIsAnalyzing(false);
    }
  };

  // Apply suggestion
  const applySuggestion = (suggestion: Suggestion) => {
    if (!currentDoc || !editorRef.current) return;

    let newContent = currentDoc.content;
    
    // Handle different types of suggestions
    if (suggestion.type === 'grammar') {
      if (suggestion.explanation.includes('capital letter')) {
        // For capitalization, find and replace the specific character/word
        const originalText = suggestion.text.replace(/"/g, ''); // Remove quotes
        const replacementText = suggestion.suggestion.replace(/"/g, ''); // Remove quotes
        newContent = newContent.replace(originalText, replacementText);
      } else if (suggestion.explanation.includes('Names should be capitalized')) {
        // For name capitalization
        const originalText = suggestion.text.replace(/"/g, ''); // Remove quotes
        const replacementText = suggestion.suggestion.replace(/"/g, ''); // Remove quotes
        newContent = newContent.replace(new RegExp(`\\b${originalText}\\b`, 'g'), replacementText);
      } else if (suggestion.explanation.includes('pronoun "I"')) {
        // For "I" pronoun
        newContent = newContent.replace(/\bi\b/g, 'I');
      } else if (suggestion.explanation.includes('comma')) {
        // For comma suggestions - handle compound sentences
        const originalText = suggestion.text;
        const replacementText = suggestion.suggestion;
        newContent = newContent.replace(originalText, replacementText);
             } else if (suggestion.explanation.includes('punctuation') || suggestion.text === 'Add period') {
         // For punctuation - replace entire content with suggestion
         newContent = suggestion.suggestion;
       }
    } else {
      // For other types, use the basic replacement
      const originalText = suggestion.text.replace(/"/g, '');
      const replacementText = suggestion.suggestion.replace(/"/g, '');
      newContent = newContent.replace(originalText, replacementText);
    }

    const updatedDoc = {
      ...currentDoc,
      content: newContent,
      wordCount: newContent.trim().split(/\s+/).filter(w => w.length > 0).length,
      updatedAt: new Date()
    };

    setCurrentDoc(updatedDoc);
    setSuggestions(suggestions.filter(s => s.id !== suggestion.id));

    // Update textarea
    editorRef.current.value = newContent;
    editorRef.current.focus();
    
    // Trigger re-analysis after a short delay
    setTimeout(async () => {
      const analysis = await analyzeText(newContent);
      setSuggestions(analysis.suggestions);
      setReadabilityStats(analysis.readabilityStats);
      setWritingStats(analysis.writingStats);
      setWritingScore(analysis.writingScore);
    }, 300);
  };

  // Create new document
  const createNewDocument = () => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      userId: 'offline-user',
      title: 'Untitled Document',
      content: '',
      type: 'other',
      wordCount: 0,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setDocuments([newDoc, ...documents]);
    setCurrentDoc(newDoc);
    setActiveView('editor');
  };

  // Landing page handlers
  const handleViewDemo = () => {
    setCurrentPage('app');
    setIsDemoMode(true);
    // Initialize demo document
    const demoDoc: Document = {
      id: 'demo-doc',
      userId: 'demo-user',
      title: '✨ Demo Document - Try WordWise AI',
      content: `Welcome to WordWise AI! 🚀

This is a live demo of our AI-powered writing assistant. Try typing some text to see how WordWise helps improve your writing:

📝 Try these examples:
• Spelling errors: "recieve", "seperate", "occured"
• Grammar mistakes: "I are happy", "There books"
• Style improvements: Write simple sentences and see enhancement suggestions
• Advanced writing analysis and suggestions

💡 Features you can explore:
• Real-time AI-powered suggestions
• Spelling and grammar checking
• Writing statistics and readability scores
• Style and tone improvements
• Word count and sentence analysis

✨ All features are fully functional in this demo!

🔒 Your demo work is temporary. Sign in to save your documents and access your personal workspace!`,
      type: 'other',
      wordCount: 95,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCurrentDoc(demoDoc);
    setDocuments([demoDoc]);
  };

  const handleMyDocuments = () => {
    if (user) {
      // User is signed in, go to their documents
      console.log('📁 Navigating to user documents...');
      setCurrentPage('app');
      setIsDemoMode(false);
      setActiveView('documents');
    } else {
      // User is not signed in, prompt them to sign in
      console.log('🔐 User not signed in, showing sign-in modal...');
      setShowAuthModal(true);
      setAuthMode('signin');
    }
  };

  const handleSignIn = () => {
    console.log('🔐 Sign In button clicked');
    setShowAuthModal(true);
    setAuthMode('signin');
    console.log('🔐 showAuthModal set to true, mode: signin');
  };

  const handleSignUp = () => {
    console.log('🔐 Sign Up button clicked');
    setShowAuthModal(true);
    setAuthMode('signup');
    console.log('🔐 showAuthModal set to true, mode: signup');
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 Starting Google sign-in from UI...');
      const user = await signInWithGoogle();
      if (user) {
        console.log('✅ Google sign-in completed successfully:', user.email);
        // The auth state listener will handle the rest
      }
    } catch (error: any) {
      console.error('❌ Google sign-in failed:', error);
      alert(`Sign-in failed: ${error.message}`);
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting email sign-in from UI for:', email);
      const user = await signInWithEmail(email, password);
      if (user) {
        console.log('✅ Email sign-in completed successfully:', user.email);
        // The auth state listener will handle the rest
      }
    } catch (error: any) {
      console.error('❌ Email sign-in failed:', error);
      throw error; // Let the AuthModal handle the error display
    }
  };

  const handleEmailSignUp = async (email: string, password: string, name: string) => {
    try {
      console.log('🔐 Starting email sign-up from UI for:', email);
      const user = await signUpWithEmail(email, password, name, 'student', 'General writing');
      if (user) {
        console.log('✅ Email sign-up completed successfully:', user.email);
        // The auth state listener will handle the rest
      }
    } catch (error: any) {
      console.error('❌ Email sign-up failed:', error);
      throw error; // Let the AuthModal handle the error display
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🔐 Starting sign-out from UI...');
      await signOutUser();
      console.log('✅ Sign-out completed successfully');
      // The auth state listener will handle UI cleanup
    } catch (error: any) {
      console.error('❌ Sign-out failed:', error);
      alert(`Sign-out failed: ${error.message}`);
    }
  };

  const handleBackToHome = () => {
    setCurrentPage('landing');
    setIsDemoMode(false);
  };

  // Show different pages based on currentPage
  if (currentPage === 'privacy') {
    return <PrivacyPage onBack={handleBackToHome} />;
  }
  
  if (currentPage === 'terms') {
    return <TermsPage onBack={handleBackToHome} />;
  }
  
  if (currentPage === 'support') {
    return <SupportPage onBack={handleBackToHome} />;
  }
  
  if (currentPage === 'landing') {
    return (
      <>
        <LandingPage
          onViewDemo={handleViewDemo}
          onMyDocuments={handleMyDocuments}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onPrivacy={() => setCurrentPage('privacy')}
          onTerms={() => setCurrentPage('terms')}
          onSupport={() => setCurrentPage('support')}
        />
        


        {/* Debug button for landing page */}
        <button 
          onClick={() => setShowFirebaseDebug(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '10px 15px',
            fontSize: '12px',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
          title="Debug Firebase Authentication Issues"
        >
          🔧 Debug Auth
        </button>

        {/* Authentication Modal */}
        <AuthModal
          isOpen={showAuthModal}
          mode={authMode}
          onClose={handleAuthClose}
          onGoogleSignIn={handleGoogleSignIn}
          onEmailSignIn={handleEmailSignIn}
          onEmailSignUp={handleEmailSignUp}
        />

        {/* Firebase Debug Modal */}
        <FirebaseDebug
          isOpen={showFirebaseDebug}
          onClose={() => setShowFirebaseDebug(false)}
        />
      </>
    );
  }

  if (!currentDoc) {
  return (
      <div className="loading-screen">
        <div className="loading-content">
          <h2>WordWise AI</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title" onClick={() => setCurrentPage('landing')} style={{cursor: 'pointer'}}>WordWise AI</h1>
          {user ? (
            <div className="user-info">
              <span className="user-name">👋 {user.name}</span>
              <button className="btn-signout" onClick={handleSignOut}>Sign Out</button>
            </div>
          ) : isDemoMode ? (
            <div className="demo-info">
              <span className="demo-badge">🚀 Demo Mode</span>
              <button className="btn-signin-demo" onClick={handleSignIn}>Sign In to Save</button>
            </div>
          ) : (
            <div className="guest-info">
              <span className="guest-badge">👤 Guest User</span>
              <button className="btn-signin-demo" onClick={handleSignIn}>Sign In</button>
            </div>
          )}
        </div>
        
        <div className="header-center">
          <nav className="main-nav">
            <button 
              className={`nav-btn ${activeView === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveView('editor')}
            >
              Editor
            </button>
            <button 
              className={`nav-btn ${activeView === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveView('documents')}
            >
              Documents
            </button>
          </nav>
        </div>

        <div className="header-right">
          <button className="btn-new" onClick={createNewDocument}>
            + New Document
          </button>
          <button 
            className="btn-debug"
            onClick={() => setShowFirebaseDebug(true)}
            style={{ marginRight: '10px', fontSize: '12px', padding: '6px 12px' }}
            title="Debug Firebase Connection"
          >
            🔧 Debug
          </button>
          <button 
            className="btn-sidebar"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? '→' : '←'}
          </button>
        </div>
      </header>

      <div className="app-body">
        {/* Main Content */}
        <main className={`main-content ${!showSidebar ? 'full-width' : ''}`}>
          {activeView === 'editor' && (
            <div className="editor-container">
              <div className="document-header">
                <input
                  type="text"
                  value={currentDoc.title}
                  onChange={(e) => setCurrentDoc({...currentDoc, title: e.target.value})}
                  className="document-title"
                  placeholder="Document title..."
                />
                <div className="document-stats">
                  <span>{currentDoc.wordCount} words</span>
                  <span>{currentDoc.content.length} characters</span>
                  {readabilityStats && (
                    <span className={`readability ${readabilityStats.complexity}`}>
                      {readabilityStats.gradeLevel} level
                    </span>
                  )}
                </div>
              </div>

              <div className="editor-wrapper">
                <textarea
                  ref={editorRef}
                  value={currentDoc.content}
                  onChange={handleTextChange}
                  placeholder="Start writing... WordWise AI will help you improve your text as you type."
                  className="main-editor"
                />
              </div>

              <div className="editor-footer">
                <div className="analysis-status">
                  {isAnalyzing ? (
                    <span className="analyzing">✨ Analyzing...</span>
                  ) : (
                    <span className="ready">
                      {suggestions.length > 0 
                        ? `${suggestions.length} suggestions available`
                        : 'No issues found'
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'documents' && (
            <div className="documents-view">
              <h2>My Documents</h2>
              <div className="documents-grid">
                {documents.map(doc => (
                  <div 
                    key={doc.id} 
                    className="document-card"
                    onClick={() => {
                      setCurrentDoc(doc);
                      setActiveView('editor');
                    }}
                  >
                    <h3>{doc.title}</h3>
                    <p>{doc.content.substring(0, 100)}{doc.content.length > 100 ? '...' : ''}</p>
                    <div className="document-meta">
                      <span>{doc.wordCount} words</span>
                      <span>{doc.updatedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        {showSidebar && (
          <aside className="sidebar">
            <div className="sidebar-section">
              <h3>Writing Assistant</h3>
              
              {/* Writing Score */}
              {writingScore && (
                <div className="stats-card">
                  <h4>Writing Score</h4>
                  <div className="score-display">
                    <div className={`score-circle ${writingScore.score >= 80 ? 'excellent' : writingScore.score >= 60 ? 'good' : 'needs-work'}`}>
                      {writingScore.score || 0}
                    </div>
                    <div className="score-factors">
                      {writingScore.factors.map((factor, index) => (
                        <div key={index} className="factor-item">{factor}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Readability Stats */}
              {readabilityStats && (
                <div className="stats-card">
                  <h4>Readability</h4>
                  <div className="stat-item">
                    <span>Flesch Score</span>
                    <span className={`score ${readabilityStats.complexity}`}>
                      {readabilityStats.fleschScore}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span>Reading Level</span>
                    <span>{readabilityStats.gradeLevel}</span>
                  </div>
                  <div className="stat-item">
                    <span>Reading Time</span>
                    <span>{readabilityStats.readingTime} min</span>
                  </div>
                </div>
              )}

              {/* Writing Statistics */}
              {writingStats && (
                <div className="stats-card">
                  <h4>Writing Statistics</h4>
                  <div className="stat-item">
                    <span>Words</span>
                    <span>{writingStats.wordCount}</span>
                  </div>
                  <div className="stat-item">
                    <span>Sentences</span>
                    <span>{writingStats.sentenceCount}</span>
                  </div>
                  <div className="stat-item">
                    <span>Avg Words/Sentence</span>
                    <span>{writingStats.averageWordsPerSentence}</span>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="suggestions-section">
                <h4>Suggestions ({suggestions.length})</h4>
                <div className="suggestions-list">
                  {suggestions.map(suggestion => (
                    <div key={suggestion.id} className={`suggestion-item ${suggestion.severity}`}>
                      <div className="suggestion-header">
                        <span className={`suggestion-type ${suggestion.type}`}>
                          {suggestion.type.toUpperCase()}
                        </span>
                        <span className={`suggestion-severity ${suggestion.severity}`}>
                          {suggestion.severity === 'error' ? '🔴' : 
                           suggestion.severity === 'warning' ? '🟡' : '💡'}
                        </span>
                      </div>
                      <div className="suggestion-content">
                        <div className="suggestion-text">
                          <span className="original">"{suggestion.text}"</span>
                          <span className="arrow">→</span>
                          <span className="corrected">"{suggestion.suggestion}"</span>
                        </div>
                        <p className="suggestion-explanation">{suggestion.explanation}</p>
                        <button 
                          className="btn-apply"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                  {suggestions.length === 0 && (
                    <div className="no-suggestions">
                      <p>✅ No issues found in your text!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        mode={authMode}
        onClose={handleAuthClose}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
      />

      {/* Firebase Debug Modal */}
      <FirebaseDebug
        isOpen={showFirebaseDebug}
        onClose={() => setShowFirebaseDebug(false)}
      />
    </div>
  );
}

export default App; 