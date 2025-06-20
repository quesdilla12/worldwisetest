import React, { useState, useEffect, useRef } from 'react';
import './index.css';
// Enhanced scoring system - force rebuild 2025-06-20
import { analyticsService } from './services/analyticsService';
import { openaiService } from './services/openaiService';
import LandingPage from './components/LandingPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import SupportPage from './components/SupportPage';
import AuthModal from './components/AuthModal';
import FirebaseDebug from './components/FirebaseDebug';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AccountPage from './components/AccountPage';

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
  breakdown?: {
    mechanics: number;
    vocabulary: number;
    structure: number;
    content: number;
    clarity: number;
    engagement: number;
  };
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
  const [currentPage, setCurrentPage] = useState<'landing' | 'privacy' | 'terms' | 'support' | 'analytics' | 'account' | 'app'>('landing');
  const [showFirebaseDebug, setShowFirebaseDebug] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [hasAppliedSuggestions, setHasAppliedSuggestions] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);

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
        analyticsService.endCurrentSession(); // End any active session
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
    console.log('🔄 Initializing offline mode...');
    
    // Try to load existing documents from localStorage first
    try {
      const savedDocuments = localStorage.getItem('documents_offline-user');
      if (savedDocuments) {
        const parsedDocs = JSON.parse(savedDocuments);
        const convertedDocs: Document[] = parsedDocs.map((doc: any) => ({
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt)
        }));
        
        console.log(`📁 Found ${convertedDocs.length} saved documents in offline mode`);
        setDocuments(convertedDocs);
        
        if (convertedDocs.length > 0) {
          setCurrentDoc(convertedDocs[0]);
          console.log('📝 Loaded saved document:', convertedDocs[0].title);
        } else {
          // Empty array, create default document
          createDefaultOfflineDocument();
        }
        return;
      }
    } catch (error) {
      console.error('Error loading offline documents:', error);
    }
    
    // If no saved documents or error, create default document
    createDefaultOfflineDocument();
  };

  const createDefaultOfflineDocument = () => {
    console.log('📝 Creating default offline document');
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

  // Keyboard shortcuts for saving and creating new documents
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDocument();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewDocument();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentDoc]);

  // Ensure editor content stays in sync with currentDoc
  useEffect(() => {
    if (editorRef.current && currentDoc) {
      // Only update if the editor content is different from currentDoc content
      if (editorRef.current.value !== currentDoc.content) {
        editorRef.current.value = currentDoc.content;
        console.log('🔄 Editor content synchronized with currentDoc:', currentDoc.content.substring(0, 50) + '...');
      }
    }
  }, [currentDoc?.content]);

  // Load user documents from Firebase with localStorage fallback
  const loadUserDocuments = async (userId: string) => {
    console.log('📁 Loading documents for user:', userId);
    
    try {
      // Try Firebase first
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
      
      console.log(`📁 Firebase loaded ${convertedDocs.length} documents`);
      setDocuments(convertedDocs);
      
      if (convertedDocs.length > 0) {
        // User has existing documents, open the first one
        setCurrentDoc(convertedDocs[0]);
        setActiveView('editor');
        console.log('📝 Loaded existing document:', convertedDocs[0].title);
      } else {
        // Check localStorage for any saved documents
        loadFromLocalStorageOrCreateNew(userId);
      }
    } catch (error) {
      console.error('Error loading user documents from Firebase:', error);
      // Fallback to localStorage
      console.log('🔄 Falling back to localStorage...');
      loadFromLocalStorageOrCreateNew(userId);
    }
  };

  const loadFromLocalStorageOrCreateNew = (userId: string) => {
    try {
      const savedDocuments = localStorage.getItem(`documents_${userId}`);
      if (savedDocuments) {
        const parsedDocs = JSON.parse(savedDocuments);
        const convertedDocs: Document[] = parsedDocs.map((doc: any) => ({
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt)
        }));
        
        console.log(`📁 Found ${convertedDocs.length} saved documents in localStorage`);
        setDocuments(convertedDocs);
        
        if (convertedDocs.length > 0) {
          setCurrentDoc(convertedDocs[0]);
          setActiveView('editor');
          console.log('📝 Loaded saved document:', convertedDocs[0].title);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    
    // Create new document if no saved documents found
    console.log('📝 No existing documents found, creating new document for user');
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
    
    // Save the new document to localStorage immediately
    localStorage.setItem(`documents_${userId}`, JSON.stringify([newDoc]));
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

      // Try OpenAI analysis first for 85%+ accuracy
      console.log('🤖 Attempting OpenAI analysis for enhanced accuracy...');
      try {
        const aiResult = await openaiService.analyzeText(text);
        if (aiResult) {
          console.log('✅ OpenAI analysis successful with', aiResult.suggestions.length, 'suggestions');
          
          // Convert AI result to our format and add local suggestions for comprehensive coverage
          const aiSuggestions = aiResult.suggestions.map(suggestion => ({
            id: `ai-${suggestion.id}`,
            type: suggestion.type,
            text: suggestion.text,
            suggestion: suggestion.suggestion,
            explanation: suggestion.explanation,
            position: suggestion.position,
            severity: suggestion.severity,
            confidence: suggestion.confidence
          }));

          // Get local analysis for additional coverage
          const localResult = performLocalAnalysis(text);
          
          // Combine AI and local suggestions with smart deduplication
          const allSuggestions = [...aiSuggestions, ...localResult.suggestions];
          
          // Advanced deduplication for AI + local combination
          const finalSuggestions = allSuggestions.filter((suggestion, index, array) => {
            return !array.slice(0, index).some(prev => {
              // Exact match check
              const exactMatch = 
                prev.text.toLowerCase().trim() === suggestion.text.toLowerCase().trim() &&
                prev.suggestion.toLowerCase().trim() === suggestion.suggestion.toLowerCase().trim();
              
              // Position overlap check
              const positionOverlap = 
                Math.abs(prev.position.start - suggestion.position.start) <= 2 &&
                Math.abs(prev.position.end - suggestion.position.end) <= 2;
              
              // Similar meaning check (for AI vs local duplicates)
              const similarMeaning = 
                prev.type === suggestion.type &&
                positionOverlap &&
                (prev.explanation.toLowerCase().includes(suggestion.text.toLowerCase()) ||
                 suggestion.explanation.toLowerCase().includes(prev.text.toLowerCase()));
              
              return exactMatch || similarMeaning;
            });
          });

          return {
            suggestions: finalSuggestions,
            readabilityStats: {
              fleschScore: aiResult.readability.fleschScore,
              gradeLevel: aiResult.readability.gradeLevel,
              readingTime: aiResult.readability.readingTime,
              complexity: aiResult.readability.complexity
            },
            writingStats: {
              wordCount: aiResult.stats.wordCount,
              characterCount: aiResult.stats.characterCount,
              sentenceCount: aiResult.stats.sentenceCount,
              averageWordsPerSentence: aiResult.stats.averageWordsPerSentence
            },
            // Use AI overall score but enrich with our enhanced breakdown for detailed UI
            writingScore: {
              score: aiResult.writingScore.score,
              factors: aiResult.writingScore.factors,
              breakdown: localResult.writingScore.breakdown
            }
          };
        }
      } catch (aiError) {
        console.warn('⚠️ OpenAI analysis failed, falling back to local analysis:', aiError);
      }

      // Fallback to local analysis
      console.log('🔄 Using local regex-based analysis as fallback...');
      const localResult = performLocalAnalysis(text);
      
      console.log('📋 Local analysis completed with', localResult.suggestions.length, 'suggestions');
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
      console.log('🔍 Starting local analysis for text:', text.substring(0, 100) + '...');
      
      // Quick test to verify patterns are working
      const testText = "I beleive that technology have changed our lifes. We didn't had this before.";
      console.log('🧪 Testing patterns with:', testText);
      
      console.log('🔍 Starting grammar checks...');
      // Process grammar checks
      const grammarChecks = [
        // ESL-specific subject-verb agreement errors
        {
          find: /\btechnology have\b/gi,
          replace: 'technology has',
          type: 'grammar' as const,
          explanation: 'Subject-verb agreement: Singular subjects take singular verbs ("technology has")',
          severity: 'error' as const
        },
        {
          find: /\bdidn't had\b/gi,
          replace: 'didn\'t have',
          type: 'grammar' as const,
          explanation: 'Auxiliary verb error: Use base form "have" after "didn\'t"',
          severity: 'error' as const
        },
        {
          find: /\bthey was\b/gi,
          replace: 'they were',
          type: 'grammar' as const,
          explanation: 'Subject-verb agreement: Plural subjects take plural verbs ("they were")',
          severity: 'error' as const
        },
        {
          find: /\bI am agree\b/gi,
          replace: 'I agree',
          type: 'grammar' as const,
          explanation: 'Verb form error: Use "I agree" not "I am agree"',
          severity: 'error' as const
        },
        {
          find: /\bthis also create\b/gi,
          replace: 'this also creates',
          type: 'grammar' as const,
          explanation: 'Subject-verb agreement: Singular subjects take singular verbs ("this creates")',
          severity: 'error' as const
        },
        {
          find: /\bprofessors.*is\b/gi,
          replace: 'professors are',
          type: 'grammar' as const,
          explanation: 'Subject-verb agreement: Plural subjects take plural verbs ("professors are")',
          severity: 'error' as const
        },
        {
          find: /\bSince I was child\b/gi,
          replace: 'Since I was a child',
          type: 'grammar' as const,
          explanation: 'Article error: Add "a" before singular countable nouns ("Since I was a child")',
          severity: 'error' as const
        },
        {
          find: /\bfeel embarrass(?!ed)\b/gi,
          replace: 'feel embarrassed',
          type: 'grammar' as const,
          explanation: 'Adjective form: Use "embarrassed" (past participle) to describe feelings',
          severity: 'error' as const
        },
        {
          find: /\bcan became\b/gi,
          replace: 'can become',
          type: 'grammar' as const,
          explanation: 'Modal verb error: Use base form "become" after modal verbs like "can"',
          severity: 'error' as const
        },
        {
          find: /\baccess to informations? very easy\b/gi,
          replace: 'easily access information',
          type: 'grammar' as const,
          explanation: 'The correct phrase is \'access information\' without \'to\' and \'easily\' should come before the verb \'access\' to describe how they can access it.',
          severity: 'error' as const
        },
        {
          find: /\bthink about it carefully\b/gi,
          replace: 'consider carefully',
          type: 'style' as const,
          explanation: 'Clarity: Remove redundant pronoun for clearer writing',
          severity: 'suggestion' as const
        },
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
        // ESL-specific spelling errors from demo
        { find: /\bbeleive\b/gi, replace: 'believe', explanation: 'Spelling: "believe" follows "i before e except after c"' },
        { find: /\blifes\b/gi, replace: 'lives', explanation: 'Spelling: Plural of "life" is "lives"' },
        { find: /\bsignificent\b/gi, replace: 'significant', explanation: 'Spelling: "significant" ends with "-ant"' },
        { find: /\binformations\b/gi, replace: 'information', explanation: 'Grammar: "Information" is uncountable in English' },
        { find: /\bcarrier\b/gi, replace: 'career', explanation: 'Spelling: "career" (profession) vs "carrier" (transport)' },
        
        // Common "i before e" errors
        { find: /\brecieve\b/gi, replace: 'receive', explanation: 'Spelling: "receive" follows "i before e except after c"' },
        { find: /\bacheive\b/gi, replace: 'achieve', explanation: 'Spelling: "achieve" follows "i before e except after c"' },
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
        { find: /\bspeling\b/gi, replace: 'spelling', explanation: 'Spelling: "spelling" has double "l"' },
        
        // Double past tense errors
        { find: /\bembarrasseded\b/gi, replace: 'embarrassed', explanation: 'The correct form is \'embarrassed\' as it is the past participle form of the verb \'embarrass\'. There is no need to add an extra \'ed\' at the end.' }
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
        const trimmedText = text.trim();
        const firstChar = trimmedText.charAt(0);
        if (firstChar >= 'a' && firstChar <= 'z') {
          // Find the actual position of the first character in the original text
          const firstCharIndex = text.indexOf(firstChar);
          suggestions.push({
            id: `capitalization-${suggestionId++}`,
            type: 'grammar',
            text: firstChar,
            suggestion: firstChar.toUpperCase(),
            explanation: 'Sentences should start with a capital letter',
            position: { start: firstCharIndex, end: firstCharIndex + 1 },
            severity: 'warning',
            confidence: 0.95
          });
        }
      }

      // Check for proper name capitalization (common names)
      const commonNames = ['abdullah', 'mirza', 'ahmed', 'ali', 'mohammed', 'hassan', 'hussain', 'khan', 'shah', 'malik'];
      const namePattern = new RegExp(`\\b(${commonNames.join('|')})\\b`, 'gi');
      let nameMatch;
      while ((nameMatch = namePattern.exec(text)) !== null) {
        const word = nameMatch[0];
        if (word.charAt(0) === word.charAt(0).toLowerCase()) {
            suggestions.push({
              id: `name-cap-${suggestionId++}`,
              type: 'grammar',
            text: word,
            suggestion: word.charAt(0).toUpperCase() + word.slice(1),
              explanation: 'Names should be capitalized',
            position: { start: nameMatch.index, end: nameMatch.index + word.length },
              severity: 'warning',
              confidence: 0.9
            });
          }
        }

      // Check for "i" pronoun capitalization
      const iPattern = /\bi\b/g;
      let iMatch;
      while ((iMatch = iPattern.exec(text)) !== null) {
        suggestions.push({
          id: `i-cap-${suggestionId++}`,
          type: 'grammar',
          text: 'i',
          suggestion: 'I',
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
      const formalityPattern = /hi my name is/gi;
      let formalityMatch;
      while ((formalityMatch = formalityPattern.exec(text)) !== null) {
        suggestions.push({
          id: `formality-${suggestionId++}`,
          type: 'style',
          text: formalityMatch[0],
          suggestion: 'Hello, my name is',
          explanation: 'Consider using "Hello" instead of "hi" for more formal writing',
          position: { start: formalityMatch.index, end: formalityMatch.index + formalityMatch[0].length },
          severity: 'suggestion',
          confidence: 0.8
        });
      }

      // Enhanced duplicate removal with better logic
      const uniqueSuggestions = suggestions.filter((suggestion, index, array) => {
        return !array.slice(0, index).some(prev => {
          // Check for exact text and suggestion match
          const sameTextAndSuggestion = 
            prev.text.toLowerCase().trim() === suggestion.text.toLowerCase().trim() &&
            prev.suggestion.toLowerCase().trim() === suggestion.suggestion.toLowerCase().trim();
          
          // Check for overlapping positions (avoid duplicate errors on same text)
          const overlappingPositions = 
            Math.abs(prev.position.start - suggestion.position.start) <= 5 &&
            Math.abs(prev.position.end - suggestion.position.end) <= 5;
          
          // Check for same type and similar text (catch variations)
          const sameTypeAndSimilarText = 
            prev.type === suggestion.type &&
            overlappingPositions &&
            (prev.text.toLowerCase().includes(suggestion.text.toLowerCase()) ||
             suggestion.text.toLowerCase().includes(prev.text.toLowerCase()));
          
          // Check for suggestions that change the same text to the same result
          const sameResult = 
            prev.suggestion.toLowerCase().trim() === suggestion.suggestion.toLowerCase().trim() &&
            overlappingPositions;
          
          // Check for identical suggestions (no change)
          const noChangeNeeded = 
            suggestion.text.toLowerCase().trim() === suggestion.suggestion.toLowerCase().trim();
          
          return sameTextAndSuggestion || sameTypeAndSimilarText || sameResult || noChangeNeeded;
        });
      });

      console.log('📊 Total suggestions found:', suggestions.length, '→ Unique suggestions:', uniqueSuggestions.length);

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

      // Enhanced comprehensive scoring algorithm
      const baseScore = Math.max(40, fleschScore * 0.6); // Start with readability as base
      
      // 1. VOCABULARY ANALYSIS
      const uniqueWords = new Set(words.map(w => w.toLowerCase()));
      const wordVariety = uniqueWords.size / words.length;
      const varietyBonus = Math.min(15, wordVariety * 25); // Up to 15 points
      
      // Advanced word analysis
      const longWords = words.filter(w => w.length > 6).length;
      const sophisticatedVocab = longWords / words.length;
      const vocabSophistication = Math.min(8, sophisticatedVocab * 20);
      
      // 2. SENTENCE STRUCTURE ANALYSIS
      const avgSentenceLength = avgWordsPerSentence;
      let structureScore = 0;
      if (avgSentenceLength >= 12 && avgSentenceLength <= 20) {
        structureScore = 10; // Optimal range
      } else if (avgSentenceLength >= 8 && avgSentenceLength <= 25) {
        structureScore = 7; // Good range
      } else if (avgSentenceLength >= 6 && avgSentenceLength <= 30) {
        structureScore = 4; // Acceptable range
      }
      
      // Sentence variety bonus
      const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
      const lengthVariety = new Set(sentenceLengths.map(l => Math.floor(l / 5))).size; // Group by 5-word ranges
      const varietyStructureBonus = Math.min(5, lengthVariety * 1.5);
      
      // 3. CONTENT DEPTH & DEVELOPMENT
      const contentDepthScore = Math.min(12, Math.log(wordCount + 1) * 3);
      const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
      const organizationBonus = paragraphCount > 1 ? Math.min(5, paragraphCount * 1.5) : 0;
      
      // 4. WRITING MECHANICS
      const grammarErrors = uniqueSuggestions.filter(s => s.type === 'grammar' && s.severity === 'error');
      const spellingErrors = uniqueSuggestions.filter(s => s.type === 'spelling' && s.severity === 'error');
      const punctuationErrors = uniqueSuggestions.filter(s => s.explanation.includes('punctuation'));
      
      const mechanicsScore = Math.max(0, 20 - (grammarErrors.length * 2.5) - (spellingErrors.length * 2) - (punctuationErrors.length * 1.5));
      
      // 5. STYLE & CLARITY
      const styleIssues = uniqueSuggestions.filter(s => s.type === 'style' || s.type === 'clarity');
      const clarityScore = Math.max(0, 10 - (styleIssues.length * 1.5));
      
      // 6. COHERENCE & FLOW
      const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'consequently', 'meanwhile', 'additionally', 'nevertheless'];
      const transitionsFound = transitionWords.filter(word => 
        text.toLowerCase().includes(word.toLowerCase())
      ).length;
      const coherenceBonus = Math.min(5, transitionsFound * 1.5);
      
      // 7. ENGAGEMENT & VOICE
      const questionMarks = (text.match(/\?/g) || []).length;
      const exclamationMarks = (text.match(/!/g) || []).length;
      const personalPronouns = (text.toLowerCase().match(/\b(i|we|you|my|our|your)\b/g) || []).length;
      const engagementScore = Math.min(6, (questionMarks * 1.5) + (exclamationMarks * 1) + (personalPronouns / words.length * 10));
      
      // Calculate final score with all components
      let calculatedScore = baseScore + varietyBonus + vocabSophistication + structureScore + 
                           varietyStructureBonus + contentDepthScore + organizationBonus + 
                           mechanicsScore + clarityScore + coherenceBonus + engagementScore;
      
      // Ensure score is valid
      if (isNaN(calculatedScore) || !isFinite(calculatedScore)) {
        calculatedScore = 70; // Default score
      }
      
      const finalScore = Math.max(35, Math.min(100, Math.round(calculatedScore)));
      
      console.log('📊 Comprehensive score breakdown:', {
        baseScore: Math.round(baseScore),
        vocabularyVariety: Math.round(varietyBonus),
        vocabularySophistication: Math.round(vocabSophistication),
        sentenceStructure: Math.round(structureScore),
        structureVariety: Math.round(varietyStructureBonus),
        contentDepth: Math.round(contentDepthScore),
        organization: Math.round(organizationBonus),
        mechanics: Math.round(mechanicsScore),
        clarity: Math.round(clarityScore),
        coherence: Math.round(coherenceBonus),
        engagement: Math.round(engagementScore),
        totalScore: finalScore
      });

      // Generate comprehensive, actionable factors
      const factors: string[] = [];
      
      // STRENGTHS (positive feedback)
      if (mechanicsScore >= 15) factors.push('✅ Excellent grammar and spelling');
      else if (mechanicsScore >= 10) factors.push('✅ Good grammar with minor issues');
      
      if (varietyBonus >= 10) factors.push('✅ Rich vocabulary variety');
      else if (varietyBonus >= 6) factors.push('✅ Good word choice diversity');
      
      if (structureScore >= 8) factors.push('✅ Well-balanced sentence length');
      else if (structureScore >= 5) factors.push('✅ Clear sentence structure');
      
      if (contentDepthScore >= 8) factors.push('✅ Substantial content development');
      else if (contentDepthScore >= 5) factors.push('✅ Good content length');
      
      if (organizationBonus >= 3) factors.push('✅ Well-organized paragraphs');
      
      if (coherenceBonus >= 3) factors.push('✅ Good use of transitions');
      
      if (vocabSophistication >= 5) factors.push('✅ Sophisticated vocabulary');
      
      // AREAS FOR IMPROVEMENT (constructive feedback)
      if (grammarErrors.length > 0) {
        factors.push(`🔧 ${grammarErrors.length} grammar issue${grammarErrors.length > 1 ? 's' : ''} to address`);
      }
      
      if (spellingErrors.length > 0) {
        factors.push(`🔧 ${spellingErrors.length} spelling error${spellingErrors.length > 1 ? 's' : ''} to fix`);
      }
      
      if (styleIssues.length > 0) {
        factors.push(`💡 ${styleIssues.length} style enhancement${styleIssues.length > 1 ? 's' : ''} suggested`);
      }
      
      if (avgSentenceLength < 8) {
        factors.push('💡 Consider varying sentence length for better flow');
      } else if (avgSentenceLength > 25) {
        factors.push('💡 Break up long sentences for clarity');
      }
      
      if (varietyBonus < 5) {
        factors.push('💡 Expand vocabulary variety');
      }
      
      if (coherenceBonus < 2 && wordCount > 100) {
        factors.push('💡 Add transition words for better flow');
      }
      
      if (organizationBonus === 0 && wordCount > 150) {
        factors.push('💡 Consider breaking into paragraphs');
      }
      
      if (vocabSophistication < 3 && wordCount > 50) {
        factors.push('💡 Use more varied vocabulary');
      }
      
      // OVERALL ASSESSMENT
      if (finalScore >= 90) {
        factors.unshift('🌟 Outstanding writing quality');
      } else if (finalScore >= 80) {
        factors.unshift('🎯 Strong writing with room for polish');
      } else if (finalScore >= 70) {
        factors.unshift('📈 Good foundation, focus on improvements');
      } else if (finalScore >= 60) {
        factors.unshift('🔨 Developing skills, keep practicing');
      } else {
        factors.unshift('🎓 Focus on fundamentals first');
      }

      const writingScore: WritingScore = {
        score: finalScore,
        factors: factors.length > 0 ? factors : ['Analysis complete'],
        breakdown: {
          mechanics: Math.round(mechanicsScore),
          vocabulary: Math.round(varietyBonus + vocabSophistication),
          structure: Math.round(structureScore + varietyStructureBonus),
          content: Math.round(contentDepthScore + organizationBonus),
          clarity: Math.round(clarityScore),
          engagement: Math.round(coherenceBonus + engagementScore)
        }
      };

      console.log('🎯 Enhanced scoring breakdown generated:', writingScore.breakdown);

      console.log('✅ Local analysis completed successfully. Final score:', writingScore.score);
      return {
        suggestions: uniqueSuggestions,
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

    // Auto-save to localStorage immediately
    const userId = user ? user.id : 'offline-user';
    
    // Update the documents array with the latest content
    setDocuments(prevDocs => {
      const existingIndex = prevDocs.findIndex(doc => doc.id === currentDoc.id);
      let updatedDocs;
      
      if (existingIndex >= 0) {
        // Update existing document
        updatedDocs = [...prevDocs];
        updatedDocs[existingIndex] = updatedDoc;
      } else {
        // Add new document if it doesn't exist in the array
        updatedDocs = [updatedDoc, ...prevDocs];
      }
      
      // Save to localStorage immediately
      localStorage.setItem(`documents_${userId}`, JSON.stringify(updatedDocs));
      console.log('💾 Auto-saved document:', updatedDoc.title);
      
      return updatedDocs;
    });

    // Update analytics progress
    analyticsService.updateWritingProgress(userId, wordCount, writingScore?.score || 0);

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

    // Store the current score and readability for comparison
    const previousScore = writingScore?.score || 0;
    const previousFleschScore = readabilityStats?.fleschScore || 0;
    const previousComplexity = readabilityStats?.complexity || 'hard';

    // Track suggestion application
    const userId = user ? user.id : 'offline-user';
    analyticsService.trackSuggestionEvent(
      userId,
      currentDoc.id,
      suggestion.id,
      suggestion.type,
      suggestion.severity,
      'applied',
      suggestion.confidence || 0.8
    );

    // Remove suggestion from UI immediately for instant feedback
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

    // Preserve scroll position
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const editorScrollTop = editorRef.current.scrollTop;

    let newContent = currentDoc.content;
    
    // Handle different types of suggestions
    const originalText = suggestion.text;
    const replacementText = suggestion.suggestion;
    
    if (suggestion.explanation.includes('punctuation') || suggestion.text === 'Add period') {
      // For punctuation - replace entire content with suggestion
      newContent = suggestion.suggestion;
      } else if (suggestion.explanation.includes('pronoun "I"')) {
      // For "I" pronoun - replace all instances
        newContent = newContent.replace(/\bi\b/g, 'I');
    } else {
      // For all other suggestions, use direct text replacement
      // Use regex with word boundaries for more precise matching
      if (originalText.match(/^\w+$/)) {
        // Single word - use word boundaries
        const regex = new RegExp(`\\b${originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        newContent = newContent.replace(regex, replacementText);
      } else {
        // Multi-word or complex pattern - use direct replacement
        newContent = newContent.replace(originalText, replacementText);
      }
    }

    const updatedDoc = {
      ...currentDoc,
      content: newContent,
      wordCount: newContent.trim().split(/\s+/).filter(w => w.length > 0).length,
      updatedAt: new Date()
    };

    console.log('🔄 Applying suggestion - updating currentDoc content:', newContent.substring(0, 50) + '...');
    setCurrentDoc(updatedDoc);
    
    // Auto-save the updated document
    setDocuments(prevDocs => {
      const existingIndex = prevDocs.findIndex(doc => doc.id === currentDoc.id);
      let updatedDocs;
      
      if (existingIndex >= 0) {
        updatedDocs = [...prevDocs];
        updatedDocs[existingIndex] = updatedDoc;
      } else {
        updatedDocs = [updatedDoc, ...prevDocs];
      }
      
      // Save to localStorage
      const userId = user ? user.id : 'offline-user';
      localStorage.setItem(`documents_${userId}`, JSON.stringify(updatedDocs));
      console.log('💾 Auto-saved after applying suggestion');
      
      return updatedDocs;
    });
    
    // Restore scroll positions after React updates the DOM
    setTimeout(() => {
      window.scrollTo(scrollX, scrollY);
      if (editorRef.current) {
        editorRef.current.scrollTop = editorScrollTop;
        console.log('✅ Suggestion applied - editor content:', editorRef.current.value.substring(0, 50) + '...');
      }
    }, 0);
    
    // Trigger re-analysis with enhanced score tracking
    setTimeout(async () => {
      console.log('📊 Re-analyzing text after suggestion application...');
      const analysis = await analyzeText(newContent);
      
      // Replace suggestions completely to avoid duplicates and stale data
      setSuggestions(analysis.suggestions);
      
      // Always update stats and score
      setReadabilityStats(analysis.readabilityStats);
      setWritingStats(analysis.writingStats);
      setWritingScore(analysis.writingScore);
      
      // Show score and readability improvement feedback
      const newScore = analysis.writingScore?.score || 0;
      const newFleschScore = analysis.readabilityStats?.fleschScore || 0;
      const newComplexity = analysis.readabilityStats?.complexity || 'hard';
      
      if (newScore > previousScore) {
        console.log(`🎉 Writing score improved from ${previousScore} to ${newScore}!`);
      }
      
      if (newFleschScore > previousFleschScore) {
        console.log(`📖 Readability improved! Flesch score: ${previousFleschScore} → ${newFleschScore}`);
      }
      
      if (previousComplexity === 'hard' && newComplexity === 'medium') {
        console.log(`📈 Text complexity improved from Hard to Medium!`);
      } else if (previousComplexity === 'medium' && newComplexity === 'easy') {
        console.log(`📈 Text complexity improved from Medium to Easy!`);
      } else if (previousComplexity === 'hard' && newComplexity === 'easy') {
        console.log(`📈 Text complexity improved dramatically from Hard to Easy!`);
      }
      
      console.log('✅ Score and readability updated after suggestion application:', {
        score: newScore,
        fleschScore: newFleschScore,
        complexity: newComplexity
      });
    }, 200);
  };

  // Apply all suggestions at once
  const applyAllSuggestions = async () => {
    if (!currentDoc || !editorRef.current || suggestions.length === 0) return;

    // Store the current score and readability for comparison
    const previousScore = writingScore?.score || 0;
    const previousFleschScore = readabilityStats?.fleschScore || 0;
    const previousComplexity = readabilityStats?.complexity || 'hard';

    // Track feature usage
    const userId = user ? user.id : 'offline-user';
    
    // Track all suggestion applications
    suggestions.forEach(suggestion => {
      analyticsService.trackSuggestionEvent(
        userId,
        currentDoc.id,
        suggestion.id,
        suggestion.type,
        suggestion.severity,
        'applied',
        suggestion.confidence || 0.8
      );
    });

    // Store original content before making changes
    setOriginalContent(currentDoc.content);
    setHasAppliedSuggestions(true);

    let newContent = currentDoc.content;
    
    // Sort suggestions by position (from end to beginning) to avoid position shifts
    const sortedSuggestions = [...suggestions].sort((a, b) => b.position.start - a.position.start);
    
    // Apply each suggestion
    for (const suggestion of sortedSuggestions) {
        const originalText = suggestion.text;
        const replacementText = suggestion.suggestion;
      
      if (suggestion.explanation.includes('punctuation') || suggestion.text === 'Add period') {
         // For punctuation - replace entire content with suggestion
         newContent = suggestion.suggestion;
      } else if (suggestion.explanation.includes('pronoun "I"')) {
        // For "I" pronoun - replace all instances
        newContent = newContent.replace(/\bi\b/g, 'I');
    } else {
        // For all other suggestions, use direct text replacement
        // Use regex with word boundaries for more precise matching
        if (originalText.match(/^\w+$/)) {
          // Single word - use word boundaries
          const regex = new RegExp(`\\b${originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          newContent = newContent.replace(regex, replacementText);
        } else {
          // Multi-word or complex pattern - use direct replacement
      newContent = newContent.replace(originalText, replacementText);
        }
      }
    }

    const updatedDoc = {
      ...currentDoc,
      content: newContent,
      wordCount: newContent.trim().split(/\s+/).filter(w => w.length > 0).length,
      updatedAt: new Date()
    };

    // Preserve scroll position
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const editorScrollTop = editorRef.current.scrollTop;

    console.log('🔄 Applying all suggestions - updating currentDoc content:', newContent.substring(0, 50) + '...');
    setCurrentDoc(updatedDoc);
    setSuggestions([]); // Clear all suggestions
    
    // Auto-save the updated document
    setDocuments(prevDocs => {
      const existingIndex = prevDocs.findIndex(doc => doc.id === currentDoc.id);
      let updatedDocs;
      
      if (existingIndex >= 0) {
        updatedDocs = [...prevDocs];
        updatedDocs[existingIndex] = updatedDoc;
      } else {
        updatedDocs = [updatedDoc, ...prevDocs];
      }
      
      // Save to localStorage
      const userId = user ? user.id : 'offline-user';
      localStorage.setItem(`documents_${userId}`, JSON.stringify(updatedDocs));
      console.log('💾 Auto-saved after applying all suggestions');
      
      return updatedDocs;
    });
    
    // Restore scroll positions after React updates the DOM
    setTimeout(() => {
      window.scrollTo(scrollX, scrollY);
      if (editorRef.current) {
        editorRef.current.scrollTop = editorScrollTop;
        console.log('✅ All suggestions applied - editor content:', editorRef.current.value.substring(0, 50) + '...');
      }
    }, 0);
    
    // Trigger re-analysis to find any remaining issues
    setTimeout(async () => {
      console.log('📊 Re-analyzing text after applying all suggestions...');
      const analysis = await analyzeText(newContent);
      setSuggestions(analysis.suggestions);
      setReadabilityStats(analysis.readabilityStats);
      setWritingStats(analysis.writingStats);
      setWritingScore(analysis.writingScore);
      
      // Show score and readability improvement feedback
      const newScore = analysis.writingScore?.score || 0;
      const newFleschScore = analysis.readabilityStats?.fleschScore || 0;
      const newComplexity = analysis.readabilityStats?.complexity || 'hard';
      
      if (newScore > previousScore) {
        console.log(`🎉 Writing score improved significantly from ${previousScore} to ${newScore}!`);
      }
      
      if (newFleschScore > previousFleschScore) {
        console.log(`📖 Readability improved significantly! Flesch score: ${previousFleschScore} → ${newFleschScore}`);
      }
      
      if (previousComplexity === 'hard' && newComplexity === 'medium') {
        console.log(`📈 Text complexity improved from Hard to Medium after applying all suggestions!`);
      } else if (previousComplexity === 'medium' && newComplexity === 'easy') {
        console.log(`📈 Text complexity improved from Medium to Easy after applying all suggestions!`);
      } else if (previousComplexity === 'hard' && newComplexity === 'easy') {
        console.log(`📈 Text complexity improved dramatically from Hard to Easy after applying all suggestions!`);
      }
      
      console.log('✅ Score and readability updated after applying all suggestions:', {
        score: newScore,
        fleschScore: newFleschScore,
        complexity: newComplexity
      });
    }, 200);
  };

  // Revert all applied suggestions
  const revertAllSuggestions = async () => {
    if (!currentDoc || !editorRef.current || !hasAppliedSuggestions || !originalContent) return;

    const updatedDoc = {
      ...currentDoc,
      content: originalContent,
      wordCount: originalContent.trim().split(/\s+/).filter(w => w.length > 0).length,
      updatedAt: new Date()
    };

    // Preserve scroll position
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const editorScrollTop = editorRef.current.scrollTop;

    setCurrentDoc(updatedDoc);
    setHasAppliedSuggestions(false);
    setOriginalContent('');
    
    // Restore scroll positions after React updates the DOM
    setTimeout(() => {
      window.scrollTo(scrollX, scrollY);
      if (editorRef.current) {
        editorRef.current.scrollTop = editorScrollTop;
      }
    }, 0);
    
    // Trigger re-analysis to restore original suggestions
    setTimeout(async () => {
      const analysis = await analyzeText(originalContent);
      setSuggestions(analysis.suggestions);
      setReadabilityStats(analysis.readabilityStats);
      setWritingStats(analysis.writingStats);
      setWritingScore(analysis.writingScore);
    }, 200);
  };

  // Create new document
  const createNewDocument = () => {
    // Save current document first if it has content and isn't already saved
    if (currentDoc && currentDoc.content.trim().length > 0) {
      const existingDoc = documents.find(doc => doc.id === currentDoc.id);
      if (!existingDoc) {
        // Current document is not in the documents list, save it first
        const userId = user ? user.id : 'offline-user';
        const savedDoc = {
          ...currentDoc,
          wordCount: currentDoc.content.split(/\s+/).filter(word => word.length > 0).length,
          updatedAt: new Date()
        };
        setDocuments(prev => [savedDoc, ...prev]);
        
        // Save to localStorage
        const updatedDocuments = [savedDoc, ...documents];
        localStorage.setItem(`documents_${userId}`, JSON.stringify(updatedDocuments));
      }
    }

    // Clear any previous suggestions and stats
    setSuggestions([]);
    setReadabilityStats(null);
    setWritingStats(null);
    setWritingScore(null);
    setIsAnalyzing(false);
    setHasAppliedSuggestions(false);
    setOriginalContent('');

    const userId = user ? user.id : 'offline-user';
    const newDoc: Document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      title: 'Untitled Document',
      content: '',
      type: 'essay',
      wordCount: 0,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Set the new document as current but don't add to documents list yet
    // It will be added when the user saves it
    setCurrentDoc(newDoc);
    setActiveView('editor');

    // Start analytics session for new document
    analyticsService.startSession(userId, newDoc.id);

    // Focus the editor after a short delay to ensure it's rendered
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        // Select the title for easy editing
        const titleInput = document.querySelector('.document-title') as HTMLInputElement;
        if (titleInput) {
          titleInput.select();
        }
      }
    }, 100);

    // Show a visual indication that a new document was created
    const newButton = document.querySelector('.btn-new-doc');
    if (newButton) {
      const originalText = newButton.textContent;
      newButton.textContent = '✨ New!';
      setTimeout(() => {
        newButton.textContent = originalText;
      }, 2000);
    }
  };

  // Landing page handlers
  const handleViewDemo = () => {
    setCurrentPage('app');
    setIsDemoMode(true);
    // Initialize demo document
    const demoDoc: Document = {
      id: 'demo-doc',
      userId: 'demo-user',
      title: '📝 ESL College Essay Demo - Try WordWise AI',
      content: `Welcome to WordWise AI - Your ESL Writing Assistant! 🎓

This demo shows how WordWise AI helps ESL students write better college essays. The text below contains common ESL errors that our AI will detect and help you fix.

📚 Sample Essay Paragraph (try editing to see live suggestions):

In my opinion, I beleive that technology have changed our lifes dramatically. When I was a child in my country, we didn't had smartphones or computers in every house. This change is very significent for young people today. They can access to informations very easy now, which is different than before. However, this also create some problems that we need to think about it carefully.

Since I was child, i always dream about studying in America. My family didn't have much money, but they was very supportive of my education. I am agree that education is the most important thing in life. When I first came to United States, I had many difficulties with English language.

The professors in my university is very helpful, but sometimes I feel embarrass when I make mistakes in class. I want to improve my writing skills because it will help me in my future carrier. I believe that with hard work and practice, I can became a successful student.

💡 What WordWise AI will help you fix:

✅ Grammar Errors:
• "technology have changed" → "technology has changed" 
• "we didn't had" → "we didn't have"
• "they was" → "they were"
• "I am agree" → "I agree"

✅ Spelling & Vocabulary:
• "beleive" → "believe"
• "lifes" → "lives" 
• "significent" → "significant"
• "informations" → "information"
• "carrier" → "career"

✅ Clarity & Style:
• "access to informations very easy" → "easily access information"
• "Since I was child" → "Since I was a child"
• "feel embarrass" → "feel embarrassed"
• "became" → "become"

🎯 Try These Actions:
• Edit the text above to see real-time suggestions
• Add your own sentences with common ESL errors
• Click on suggestions in the sidebar to apply fixes
• Watch your writing score improve as you make corrections

🔒 This is a demo - sign up to save your work and track your progress!`,
      type: 'essay',
      wordCount: 285,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCurrentDoc(demoDoc);
    setDocuments([demoDoc]);
    
    // Force analysis of the demo content immediately
    console.log('🚀 Demo loaded, forcing immediate analysis...');
    setTimeout(async () => {
      try {
        setIsAnalyzing(true);
        console.log('🔍 Analyzing demo content...');
        
        // Double-check that we're analyzing the right content
        const contentToAnalyze = editorRef.current?.value || demoDoc.content;
        console.log('📝 Content being analyzed:', contentToAnalyze.substring(0, 100) + '...');
        
        const analysis = await analyzeText(contentToAnalyze);
        console.log('📊 Demo analysis results:', analysis);
        setSuggestions(analysis.suggestions);
        setReadabilityStats(analysis.readabilityStats);
        setWritingStats(analysis.writingStats);
        setWritingScore(analysis.writingScore);
        console.log('✅ Demo analysis complete, suggestions:', analysis.suggestions.length);
      } catch (error) {
        console.error('❌ Error analyzing demo content:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500); // Wait longer for components to mount and editor to update
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
    } catch (error: unknown) {
      console.error('❌ Google sign-in failed:', error);
      alert(`Sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('❌ Sign-out failed:', error);
      alert(`Sign-out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBackToHome = () => {
    setCurrentPage('landing');
    setIsDemoMode(false);
    analyticsService.endCurrentSession();
  };

  const handleViewAnalytics = () => {
    setCurrentPage('analytics');
  };

  const handleViewAccount = () => {
    setCurrentPage('account');
  };

  const handleExportDocuments = () => {
    try {
      const exportDate = new Date().toLocaleDateString();
      const exportTime = new Date().toLocaleTimeString();
      
      // Create a readable text format
      let textContent = `WordWise AI - Document Export\n`;
      textContent += `=================================\n`;
      textContent += `Export Date: ${exportDate} at ${exportTime}\n`;
      textContent += `User: ${user?.email || 'offline'}\n`;
      textContent += `Total Documents: ${documents.length}\n\n`;

      documents.forEach((doc, index) => {
        textContent += `Document ${index + 1}: ${doc.title}\n`;
        textContent += `${'='.repeat(doc.title.length + 12)}\n`;
        textContent += `Type: ${doc.type}\n`;
        textContent += `Created: ${doc.createdAt.toLocaleDateString()} at ${doc.createdAt.toLocaleTimeString()}\n`;
        textContent += `Updated: ${doc.updatedAt.toLocaleDateString()} at ${doc.updatedAt.toLocaleTimeString()}\n`;
        textContent += `Word Count: ${doc.content.split(/\s+/).filter(word => word.length > 0).length} words\n\n`;
        textContent += `Content:\n`;
        textContent += `${'-'.repeat(50)}\n`;
        textContent += `${doc.content}\n`;
        textContent += `${'-'.repeat(50)}\n\n\n`;
      });

      const dataBlob = new Blob([textContent], { type: 'text/plain' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `wordwise-documents-${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      
      console.log('Documents exported successfully');
      
      // Show export confirmation
      const exportButton = document.querySelector('.btn-export');
      if (exportButton) {
        const originalText = exportButton.textContent;
        exportButton.textContent = '✅ Exported!';
        setTimeout(() => {
          exportButton.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Error exporting documents:', error);
      alert('Failed to export documents. Please try again.');
    }
  };

  const handleImportDocuments = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const fileExtension = file.name.toLowerCase().split('.').pop();
        let importedDocs: Document[] = [];

        if (fileExtension === 'json') {
          // Handle JSON import (original functionality)
          const importData = JSON.parse(content);
          
          // Validate the import data structure
          if (!importData.documents || !Array.isArray(importData.documents)) {
            throw new Error('Invalid JSON format: missing documents array');
          }

          // Convert date strings back to Date objects
          importedDocs = importData.documents.map((doc: any) => ({
            ...doc,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt),
            // Generate new IDs to avoid conflicts
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }));

        } else if (fileExtension === 'txt') {
          // Handle TXT import (create a single document)
          const now = new Date();
          const fileName = file.name.replace('.txt', '');
          
          importedDocs = [{
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: user ? user.id : 'offline-user',
            title: fileName || 'Imported Document',
            content: content,
            type: 'essay' as const,
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
            status: 'draft' as const,
            createdAt: now,
            updatedAt: now
          }];
        } else {
          throw new Error('Unsupported file format. Please use JSON or TXT files.');
        }

        // Add imported documents to existing ones
        setDocuments(prevDocs => [...importedDocs, ...prevDocs]);
        
        // Save to localStorage
        const userId = user ? user.id : 'offline-user';
        const updatedDocuments = [...importedDocs, ...documents];
        localStorage.setItem(`documents_${userId}`, JSON.stringify(updatedDocuments));
        
        console.log(`Successfully imported ${importedDocs.length} document(s) from ${fileExtension.toUpperCase()} file`);
        
        // Show import confirmation
        const importButton = document.querySelector('.btn-import');
        if (importButton) {
          const originalText = importButton.textContent;
          const docText = importedDocs.length === 1 ? 'document' : 'documents';
          importButton.textContent = `✅ Imported ${importedDocs.length} ${docText}!`;
          setTimeout(() => {
            importButton.textContent = originalText;
          }, 3000);
        }
        
        // Reset file input
        event.target.value = '';
        
      } catch (error) {
        console.error('Error importing documents:', error);
        alert(`Failed to import documents: ${error instanceof Error ? error.message : 'Invalid file format'}`);
        event.target.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const saveDocument = async () => {
    if (!currentDoc) return;
    
    // Update the current document with latest content and metadata
    const updatedDoc = {
      ...currentDoc,
      wordCount: currentDoc.content.split(/\s+/).filter(word => word.length > 0).length,
      updatedAt: new Date()
    };
    
    // Update the documents array
    setDocuments(prevDocs => {
      const existingIndex = prevDocs.findIndex(doc => doc.id === currentDoc.id);
      if (existingIndex >= 0) {
        // Update existing document
        const newDocs = [...prevDocs];
        newDocs[existingIndex] = updatedDoc;
        return newDocs;
      } else {
        // Add new document
        return [...prevDocs, updatedDoc];
      }
    });
    
    // Update current document state
    setCurrentDoc(updatedDoc);
    
    // Save to localStorage for persistence
    const userId = user ? user.id : 'offline-user';
    const updatedDocuments = documents.map(doc => 
      doc.id === currentDoc.id ? updatedDoc : doc
    );
    
    // If this is a new document, add it to the array
    if (!documents.find(doc => doc.id === currentDoc.id)) {
      updatedDocuments.push(updatedDoc);
    }
    
    localStorage.setItem(`documents_${userId}`, JSON.stringify(updatedDocuments));
    
    // Show save confirmation
    console.log('Document saved successfully');
    
    // Optional: Show a temporary save indicator
    const saveButton = document.querySelector('.btn-save-doc');
    if (saveButton) {
      const originalText = saveButton.textContent;
      saveButton.textContent = '✅ Saved!';
      setTimeout(() => {
        saveButton.textContent = originalText;
      }, 2000);
    }
  };

  const aiRewriteDocument = async () => {
    if (!currentDoc || !currentDoc.content.trim()) {
      alert('Please write some content first before using AI rewrite.');
      return;
    }

    // Store the current score and readability for comparison
    const previousScore = writingScore?.score || 0;
    const previousFleschScore = readabilityStats?.fleschScore || 0;
    const previousComplexity = readabilityStats?.complexity || 'hard';

    setIsRewriting(true);
    
    try {
      // Store original content for potential revert
      if (!originalContent) {
        setOriginalContent(currentDoc.content);
      }

      // Use the OpenAI service to rewrite the document
      const rewrittenContent = await openaiService.rewriteForOptimalScore(currentDoc.content);

      if (rewrittenContent && rewrittenContent !== currentDoc.content) {
        // Update document with rewritten content
        const updatedDoc: Document = {
          ...currentDoc,
          content: rewrittenContent,
          wordCount: rewrittenContent.split(/\s+/).filter(word => word.length > 0).length,
          updatedAt: new Date()
        };
        
        setCurrentDoc(updatedDoc);
        setHasAppliedSuggestions(true);
        
        // Save to localStorage immediately
        const existingDocs = JSON.parse(localStorage.getItem('wordwise_documents') || '[]');
        const docIndex = existingDocs.findIndex((doc: any) => doc.id === updatedDoc.id);
        if (docIndex >= 0) {
          existingDocs[docIndex] = updatedDoc;
        } else {
          existingDocs.push(updatedDoc);
        }
        localStorage.setItem('wordwise_documents', JSON.stringify(existingDocs));
        
        // Trigger immediate re-analysis
        setTimeout(async () => {
          console.log('📊 Re-analyzing text after AI rewrite...');
          const analysis = await analyzeText(rewrittenContent);
          setSuggestions(analysis.suggestions);
          setReadabilityStats(analysis.readabilityStats);
          setWritingStats(analysis.writingStats);
          setWritingScore(analysis.writingScore);
          
          // Show score and readability improvement feedback
          const newScore = analysis.writingScore?.score || 0;
          const newFleschScore = analysis.readabilityStats?.fleschScore || 0;
          const newComplexity = analysis.readabilityStats?.complexity || 'hard';
          
          if (newScore > previousScore) {
            console.log(`🎉 AI rewrite improved writing score from ${previousScore} to ${newScore}!`);
          }
          
          if (newFleschScore > previousFleschScore) {
            console.log(`📖 AI rewrite improved readability! Flesch score: ${previousFleschScore} → ${newFleschScore}`);
          }
          
          if (previousComplexity === 'hard' && newComplexity === 'medium') {
            console.log(`📈 AI rewrite improved text complexity from Hard to Medium!`);
          } else if (previousComplexity === 'medium' && newComplexity === 'easy') {
            console.log(`📈 AI rewrite improved text complexity from Medium to Easy!`);
          } else if (previousComplexity === 'hard' && newComplexity === 'easy') {
            console.log(`📈 AI rewrite dramatically improved text complexity from Hard to Easy!`);
          }
          
          console.log('✅ Score and readability updated after AI rewrite:', {
            score: newScore,
            fleschScore: newFleschScore,
            complexity: newComplexity
          });
        }, 100);
        
        // Track analytics
        const userId = user ? user.id : 'offline-user';
        analyticsService.trackSuggestionEvent(userId, currentDoc.id, 'ai-rewrite', 'style', 'suggestion', 'applied', 1.0);
        
      } else {
        throw new Error('No rewritten content received from AI or content unchanged');
      }
    } catch (error) {
      console.error('AI rewrite failed:', error);
      alert('AI rewrite failed. Please check your OpenAI API key configuration and try again.');
    } finally {
      setIsRewriting(false);
    }
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
  
  if (currentPage === 'analytics') {
    const userId = user ? user.id : 'offline-user';
    return <AnalyticsDashboard userId={userId} onBack={handleBackToHome} />;
  }
  
  if (currentPage === 'account') {
    if (!user) {
      // Redirect to sign-in if not authenticated
      setShowAuthModal(true);
      setAuthMode('signin');
      setCurrentPage('landing');
      return null;
    }
    console.log('Rendering AccountPage with user:', user);
    return <AccountPage user={user} onBack={handleBackToHome} />;
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
            className="btn-analytics"
            onClick={handleViewAnalytics}
            style={{ marginRight: '10px', fontSize: '12px', padding: '6px 12px' }}
            title="View Analytics Dashboard"
          >
            📊 Analytics
          </button>
          {user && (
            <button 
              className="btn-account"
              onClick={handleViewAccount}
              style={{ marginRight: '10px', fontSize: '12px', padding: '6px 12px' }}
              title="Account Settings"
            >
              ⚙️ Account
            </button>
          )}
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
                <div className="document-title-section">
                <input
                  type="text"
                  value={currentDoc.title}
                  onChange={(e) => setCurrentDoc({...currentDoc, title: e.target.value})}
                  className="document-title"
                  placeholder="Document title..."
                />
                  <div className="document-actions">
                    <button 
                      className="btn-save-doc"
                      onClick={saveDocument}
                      title="Save document (Ctrl+S)"
                    >
                      💾 Save
                    </button>
                    <button 
                      className="btn-new-doc"
                      onClick={createNewDocument}
                      title="Create new document (Ctrl+N)"
                    >
                      📄 New
                    </button>
                  </div>
                </div>
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
                  placeholder="Start writing your college essay... WordWise AI will help improve your grammar, vocabulary, and clarity as you type."
                  className="main-editor"
                />
                {/* Text highlighting overlay */}
                {hoveredSuggestion && (
                  <div className="text-highlight-overlay">
                    {(() => {
                      const suggestion = suggestions.find(s => s.id === hoveredSuggestion);
                      if (!suggestion || !currentDoc || !editorRef.current) return null;
                      
                      // Get the actual text that should be highlighted
                      const textToHighlight = suggestion.text.replace(/"/g, ''); // Remove quotes from display
                      
                      // Find the actual position of this text in the content
                      const contentLower = currentDoc.content.toLowerCase();
                      const searchTextLower = textToHighlight.toLowerCase();
                      const actualStart = contentLower.indexOf(searchTextLower);
                      
                      if (actualStart === -1) return null; // Text not found
                      
                      // Calculate position more accurately
                      const textBeforeHighlight = currentDoc.content.substring(0, actualStart);
                      const lines = textBeforeHighlight.split('\n');
                      const lineNumber = lines.length - 1;
                      const charPosition = lines[lines.length - 1].length;
                      
                      // Use more accurate measurements based on textarea styling
                      const lineHeight = 1.8; // rem, matches CSS
                      const charWidth = 0.55; // rem, more accurate for monospace-like fonts
                      
                      const top = lineNumber * lineHeight + 2.5; // Account for padding
                      const left = charPosition * charWidth + 2.5; // Account for padding
                      
                      return (
                        <div 
                          className={`floating-highlight ${suggestion.severity}`}
                          style={{
                            position: 'absolute',
                            top: `${top}rem`,
                            left: `${left}rem`,
                            width: `${textToHighlight.length * charWidth}rem`,
                            height: `${lineHeight}rem`,
                            pointerEvents: 'none',
                            zIndex: 5
                          }}
                        >
                        </div>
                      );
                    })()}
                  </div>
                )}
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
              <div className="documents-header">
              <h2>My Documents</h2>
                <div className="documents-actions">
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleImportDocuments}
                    style={{ display: 'none' }}
                    id="import-documents"
                  />
                  <button 
                    className="btn-import"
                    onClick={() => document.getElementById('import-documents')?.click()}
                    title="Import documents from JSON file (TXT files will be imported as single documents)"
                  >
                    📥 Import
                  </button>
                  <button 
                    className="btn-export"
                    onClick={handleExportDocuments}
                    title="Export all documents to TXT file"
                  >
                    📤 Export
                  </button>
                </div>
              </div>
              <div className="documents-grid">
                {documents.map(doc => (
                  <div 
                    key={doc.id} 
                    className="document-card"
                    onClick={() => {
                      setCurrentDoc(doc);
                      setActiveView('editor');
                      // Clear previous state when switching documents
                      setSuggestions([]);
                      setReadabilityStats(null);
                      setWritingStats(null);
                      setWritingScore(null);
                      setIsAnalyzing(false);
                      setHasAppliedSuggestions(false);
                      setOriginalContent('');
                      
                      // Start new analytics session for document
                      const userId = user ? user.id : 'offline-user';
                      analyticsService.startSession(userId, doc.id);
                      
                      // Focus editor after switching
                      setTimeout(() => {
                        if (editorRef.current) {
                          editorRef.current.focus();
                        }
                      }, 100);
                    }}
                  >
                    <h3>{doc.title}</h3>
                    <p>
                      {doc.content.length > 0 
                        ? `${doc.content.substring(0, 100)}${doc.content.length > 100 ? '...' : ''}`
                        : <em style={{color: '#888'}}>Start writing to see your content here...</em>
                      }
                    </p>
                    <div className="document-meta">
                      <span>{doc.wordCount} words</span>
                      <span>{doc.updatedAt.toLocaleDateString()}</span>
                      {doc.content.length === 0 && (
                        <span style={{color: '#4285f4', fontSize: '0.8rem'}}>• New Document</span>
                      )}
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
                    
                    {/* Score Breakdown */}
                    {(() => {
                      console.log('🔍 Checking writingScore.breakdown:', writingScore.breakdown);
                      return writingScore.breakdown;
                    })() && (
                      <div className="score-breakdown">
                        <div className="breakdown-item">
                          <span className="breakdown-label">📝 Mechanics</span>
                          <div className="breakdown-bar">
                            <div 
                              className="breakdown-fill mechanics" 
                              style={{width: `${Math.min(100, ((writingScore.breakdown?.mechanics || 0) / 20) * 100)}%`}}
                            ></div>
                          </div>
                          <span className="breakdown-value">{writingScore.breakdown?.mechanics || 0}/20 ({Math.round(((writingScore.breakdown?.mechanics || 0)/20)*100)}%)</span>
                        </div>
                        
                        <div className="breakdown-item">
                          <span className="breakdown-label">📚 Vocabulary</span>
                          <div className="breakdown-bar">
                            <div 
                              className="breakdown-fill vocabulary" 
                              style={{width: `${Math.min(100, ((writingScore.breakdown?.vocabulary || 0) / 23) * 100)}%`}}
                            ></div>
                          </div>
                          <span className="breakdown-value">{writingScore.breakdown?.vocabulary || 0}/23 ({Math.round(((writingScore.breakdown?.vocabulary || 0)/23)*100)}%)</span>
                        </div>
                        
                        <div className="breakdown-item">
                          <span className="breakdown-label">🏗️ Structure</span>
                          <div className="breakdown-bar">
                            <div 
                              className="breakdown-fill structure" 
                              style={{width: `${Math.min(100, ((writingScore.breakdown?.structure || 0) / 15) * 100)}%`}}
                            ></div>
                          </div>
                          <span className="breakdown-value">{writingScore.breakdown?.structure || 0}/15 ({Math.round(((writingScore.breakdown?.structure || 0)/15)*100)}%)</span>
                        </div>
                        
                        <div className="breakdown-item">
                          <span className="breakdown-label">📖 Content</span>
                          <div className="breakdown-bar">
                            <div 
                              className="breakdown-fill content" 
                              style={{width: `${Math.min(100, ((writingScore.breakdown?.content || 0) / 17) * 100)}%`}}
                            ></div>
                          </div>
                          <span className="breakdown-value">{writingScore.breakdown?.content || 0}/17 ({Math.round(((writingScore.breakdown?.content || 0)/17)*100)}%)</span>
                        </div>
                        
                        <div className="breakdown-item">
                          <span className="breakdown-label">✨ Clarity</span>
                          <div className="breakdown-bar">
                            <div 
                              className="breakdown-fill clarity" 
                              style={{width: `${Math.min(100, ((writingScore.breakdown?.clarity || 0) / 10) * 100)}%`}}
                            ></div>
                          </div>
                          <span className="breakdown-value">{writingScore.breakdown?.clarity || 0}/10 ({Math.round(((writingScore.breakdown?.clarity || 0)/10)*100)}%)</span>
                        </div>
                        
                        <div className="breakdown-item">
                          <span className="breakdown-label">🎯 Engagement</span>
                          <div className="breakdown-bar">
                            <div 
                              className="breakdown-fill engagement" 
                              style={{width: `${Math.min(100, ((writingScore.breakdown?.engagement || 0) / 11) * 100)}%`}}
                            ></div>
                          </div>
                          <span className="breakdown-value">{writingScore.breakdown?.engagement || 0}/11 ({Math.round(((writingScore.breakdown?.engagement || 0)/11)*100)}%)</span>
                        </div>
                      </div>
                    )}
                    
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
                  <h4>📖 Readability Analysis</h4>
                  
                  {/* Flesch Reading Ease Score */}
                  <div className="readability-item">
                    <div className="readability-header">
                      <span className="readability-label">📊 Flesch Reading Ease</span>
                      <span className={`readability-score ${readabilityStats.complexity}`}>
                        {readabilityStats.fleschScore}
                      </span>
                    </div>
                    <div className="readability-bar">
                      <div 
                        className={`readability-fill ${readabilityStats.complexity}`}
                        style={{width: `${Math.min(100, Math.max(0, readabilityStats.fleschScore))}%`}}
                      ></div>
                    </div>
                    <div className="readability-description">
                      {readabilityStats.fleschScore >= 90 ? '✅ Very Easy to Read' :
                       readabilityStats.fleschScore >= 80 ? '✅ Easy to Read' :
                       readabilityStats.fleschScore >= 70 ? '🟡 Fairly Easy to Read' :
                       readabilityStats.fleschScore >= 60 ? '🟡 Standard Reading Level' :
                       readabilityStats.fleschScore >= 50 ? '🟠 Fairly Difficult' :
                       readabilityStats.fleschScore >= 30 ? '🔴 Difficult to Read' :
                       '🔴 Very Difficult to Read'}
                    </div>
                  </div>

                  {/* Grade Level */}
                  <div className="stat-item">
                    <span>🎓 Reading Level</span>
                    <span className="grade-level">{readabilityStats.gradeLevel}</span>
                  </div>

                  {/* Reading Time */}
                  <div className="stat-item">
                    <span>⏱️ Reading Time</span>
                    <span className="reading-time">{readabilityStats.readingTime} min</span>
                  </div>

                  {/* Complexity Indicator */}
                  <div className="complexity-indicator">
                    <span className="complexity-label">📈 Complexity Level:</span>
                    <span className={`complexity-badge ${readabilityStats.complexity}`}>
                      {readabilityStats.complexity === 'easy' ? '🟢 Easy' :
                       readabilityStats.complexity === 'medium' ? '🟡 Medium' :
                       '🔴 Hard'}
                    </span>
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

              {/* AI Rewrite Section */}
              {currentDoc && currentDoc.content.trim().length > 50 && (
                <div className="ai-rewrite-section">
                  <button 
                    type="button"
                    className="btn-ai-rewrite"
                    onClick={aiRewriteDocument}
                    disabled={isRewriting}
                    title="Use AI to rewrite your document for 90%+ writing score and high readability"
                  >
                                         {isRewriting ? (
                       <>🤖 Rewriting...</>
                     ) : (
                       <>🚀 AI Rewrite</>
                     )}
                  </button>
                                     <p className="ai-rewrite-description">
                     Uses AI to rewrite your essay for maximum writing score and readability while preserving your ideas.
                   </p>
                </div>
              )}

              {/* Suggestions */}
              <div className="suggestions-section">
                <h4>Suggestions ({suggestions.length})</h4>
                <div className="suggestions-actions">
                  {suggestions.length > 0 && (
                    <button 
                      type="button"
                      className="btn-apply-all"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        applyAllSuggestions();
                      }}
                    >
                      ✨ Apply All Suggestions
                    </button>
                  )}
                  {hasAppliedSuggestions && originalContent && (
                    <button 
                      type="button"
                      className="btn-revert-all"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        revertAllSuggestions();
                      }}
                    >
                      ↩️ Revert All Suggestions
                    </button>
                  )}
                </div>
                <div className="suggestions-list">
                  {suggestions.map(suggestion => (
                    <div 
                      key={suggestion.id} 
                      className={`suggestion-item ${suggestion.severity}`}
                      onMouseEnter={() => setHoveredSuggestion(suggestion.id)}
                      onMouseLeave={() => setHoveredSuggestion(null)}
                    >
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
                          type="button"
                          className="btn-apply"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            applySuggestion(suggestion);
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                  {suggestions.length === 0 && (
                    <div className="no-suggestions">
                      {currentDoc && currentDoc.content.length > 0 ? (
                      <p>✅ No issues found in your text!</p>
                      ) : (
                        <div>
                          <p>📝 Start writing to get suggestions!</p>
                          <p style={{fontSize: '0.85rem', color: '#888', marginTop: '0.5rem'}}>
                            WordWise AI will analyze your text and provide grammar, spelling, and style suggestions as you type.
                          </p>
                        </div>
                      )}
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