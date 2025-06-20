import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Only for client-side usage in development
});

export interface AISuggestion {
  id: string;
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'conciseness' | 'engagement' | 'tone';
  text: string;
  suggestion: string;
  explanation: string;
  position: { start: number; end: number };
  severity: 'error' | 'warning' | 'suggestion';
  confidence: number;
}

export interface AIAnalysisResult {
  suggestions: AISuggestion[];
  readability: {
    fleschScore: number;
    gradeLevel: string;
    readingTime: number;
    complexity: 'easy' | 'medium' | 'hard';
  };
  stats: {
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
    averageWordsPerSentence: number;
  };
  writingScore: {
    score: number;
    factors: string[];
  };
  tone?: {
    primary: string;
    confidence: number;
    suggestions: string[];
  };
}

export class OpenAIAnalysisService {
  private isConfigured(): boolean {
    const hasKey = !!(import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here');
    console.log('🔧 OpenAI API Key check:', {
      hasKey,
      keyStart: import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 10) + '...',
      keyLength: import.meta.env.VITE_OPENAI_API_KEY?.length
    });
    return hasKey;
  }

  async analyzeText(text: string): Promise<AIAnalysisResult | null> {
    if (!this.isConfigured()) {
      console.log('🔧 OpenAI API key not configured, falling back to local analysis');
      return null;
    }

    if (!text.trim()) {
      return null;
    }

    try {
      console.log('🤖 Analyzing text with OpenAI...');

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert ESL writing tutor specializing in helping ESL students write college essays. Analyze the given text and provide detailed feedback in JSON format. Return ONLY valid JSON with this structure:
{
  "suggestions": [
    {
      "type": "grammar|spelling|style|clarity|conciseness|engagement|tone",
      "text": "original text with error",
      "suggestion": "corrected text",
      "explanation": "detailed explanation that helps ESL students learn the rule",
      "severity": "error|warning|suggestion",
      "confidence": 0.0-1.0
    }
  ],
  "readability": {
    "fleschScore": 0-100,
    "gradeLevel": "Elementary|Middle School|High School|College|Graduate",
    "complexity": "easy|medium|hard"
  },
  "writingScore": {
    "score": 0-100,
    "factors": ["factor1", "factor2"]
  },
  "tone": {
    "primary": "formal|informal|professional|casual|academic|creative",
    "confidence": 0.0-1.0,
    "suggestions": ["suggestion1", "suggestion2"]
  }
}

Focus specifically on ESL errors common in college essays:
- Subject-verb agreement errors (especially with singular/plural confusion)
- Article usage (a/an/the) and countable/uncountable nouns
- Preposition errors (in/on/at, to/for, etc.)
- Verb tense consistency and modal verb usage
- Word order issues and sentence structure
- Common spelling mistakes from native language interference
- Academic vocabulary and formality level for college writing
- Clarity improvements for complex ideas

For each suggestion, provide explanations that help students understand WHY it's wrong and HOW to remember the rule. Be thorough but practical. Prioritize errors that affect meaning and academic tone.`
          },
          {
            role: "user",
            content: `Please analyze this text:\n\n"${text}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      console.log('🤖 Raw AI Response:', aiResponse);

      // Parse the JSON response
      const analysis = JSON.parse(aiResponse);
      
      // Calculate basic stats
      const words = text.trim().split(/\s+/).filter(w => w.length > 0);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const wordCount = words.length;
      const sentenceCount = sentences.length || 1;
      const readingTime = Math.ceil(wordCount / 200);

      // Add accurate positions to suggestions by finding text matches
      const suggestionsWithPositions = analysis.suggestions.map((suggestion: any, index: number) => {
        let position = { start: 0, end: suggestion.text?.length || 0 };
        
        // Try to find the actual position of the text in the original
        if (suggestion.text && suggestion.text.trim().length > 0) {
          // First try exact case match
          let textIndex = text.indexOf(suggestion.text);
          
          // If not found, try case-insensitive match
          if (textIndex === -1) {
            textIndex = text.toLowerCase().indexOf(suggestion.text.toLowerCase());
          }
          
          // If still not found, try to find a partial match
          if (textIndex === -1 && suggestion.text.length > 3) {
            const words = suggestion.text.split(' ');
            if (words.length > 1) {
              // Try to find the first word of the suggestion
              textIndex = text.toLowerCase().indexOf(words[0].toLowerCase());
            }
          }
          
          if (textIndex !== -1) {
            position = { 
              start: textIndex, 
              end: textIndex + suggestion.text.length 
            };
          } else {
            console.warn('Could not find position for suggestion text:', suggestion.text);
          }
        }
        
        return {
          id: `ai-${index}`,
          ...suggestion,
          position,
          confidence: suggestion.confidence || 0.9 // Higher confidence for AI suggestions
        };
      });

      const result: AIAnalysisResult = {
        suggestions: suggestionsWithPositions,
        readability: {
          ...analysis.readability,
          readingTime
        },
        stats: {
          wordCount,
          characterCount: text.length,
          sentenceCount,
          averageWordsPerSentence: Math.round((wordCount / sentenceCount) * 10) / 10
        },
        writingScore: analysis.writingScore,
        tone: analysis.tone
      };

      console.log('✅ AI Analysis complete:', result);
      return result;

    } catch (error) {
      console.error('❌ OpenAI analysis failed:', error);
      return null;
    }
  }

  async checkGrammar(text: string): Promise<AISuggestion[]> {
    if (!this.isConfigured() || !text.trim()) {
      return [];
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a grammar checker. Find and fix grammar errors in the text. Return ONLY a JSON array of grammar corrections:
[
  {
    "type": "grammar",
    "text": "original incorrect text",
    "suggestion": "corrected text", 
    "explanation": "why this is incorrect and how to fix it",
    "severity": "error|warning",
    "confidence": 0.0-1.0
  }
]

Focus on:
- Subject-verb agreement
- Tense consistency
- Pronoun agreement
- Run-on sentences
- Fragments
- Punctuation errors

If no errors found, return empty array: []`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '[]');
      return result.map((item: any, index: number) => ({
        ...item,
        id: `grammar-ai-${index}`,
        position: { start: 0, end: item.text?.length || 0 }
      }));

    } catch (error) {
      console.error('Grammar check failed:', error);
      return [];
    }
  }

  async improveTone(text: string, targetTone: string): Promise<string> {
    if (!this.isConfigured() || !text.trim()) {
      return text;
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Rewrite the given text to match the ${targetTone} tone while preserving the original meaning and key information. Return only the rewritten text, no additional commentary.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.4,
        max_tokens: 1000
      });

      return response.choices[0]?.message?.content || text;

    } catch (error) {
      console.error('Tone improvement failed:', error);
      return text;
    }
  }

  async rewriteForOptimalScore(text: string): Promise<string> {
    console.log('🚀 rewriteForOptimalScore called with text length:', text.length);
    
    if (!this.isConfigured()) {
      console.error('❌ OpenAI not configured for rewrite');
      return text;
    }

    if (!text.trim()) {
      console.error('❌ Empty text provided for rewrite');
      return text;
    }

    try {
      console.log('🚀 Rewriting text for optimal score with OpenAI...');

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert college essay writing coach specializing in helping ESL students achieve exceptional writing scores. Your task is to rewrite the given essay to achieve a 90%+ writing score while maintaining the author's original ideas, experiences, and authentic voice.

WRITING SCORE OPTIMIZATION (Target: 90%+):

1. MECHANICS (20/20 points):
   - Perfect grammar, spelling, and punctuation
   - Correct subject-verb agreement and tense consistency
   - Proper article usage (a/an/the)
   - Accurate preposition usage
   - Eliminate all ESL-specific errors

2. VOCABULARY (23/23 points):
   - Use sophisticated, college-level vocabulary
   - Vary word choice to avoid repetition
   - Replace simple words with more precise alternatives
   - Maintain natural flow (avoid over-complicated words)
   - Use academic vocabulary appropriately

3. STRUCTURE (15/15 points):
   - Vary sentence lengths (mix short, medium, and long sentences)
   - Use different sentence structures (simple, compound, complex)
   - Create smooth transitions between ideas
   - Ensure logical paragraph organization

4. CONTENT (17/17 points):
   - Enhance depth and development of ideas
   - Add specific examples and details
   - Improve organization and coherence
   - Strengthen the narrative arc
   - Ensure clear thesis and supporting arguments

5. CLARITY (10/10 points):
   - Eliminate ambiguous phrasing
   - Improve readability and flow
   - Make complex ideas accessible
   - Ensure every sentence serves a purpose

6. ENGAGEMENT (11/11 points):
   - Strengthen the author's unique voice
   - Create compelling opening and closing
   - Use varied sentence beginnings
   - Add emotional resonance where appropriate
   - Maintain reader interest throughout

READABILITY OPTIMIZATION (Target: Flesch Score 70-80):
- Use clear, concise sentences
- Balance complexity with accessibility
- Maintain engaging but readable prose
- Ensure smooth flow between sentences and paragraphs

ESL STUDENT CONSIDERATIONS:
- Preserve the author's personal experiences and authentic voice
- Use natural, fluent English expressions
- Avoid overly complex vocabulary that might sound unnatural
- Maintain the original meaning and intent
- Ensure the rewritten essay still sounds like the student's work

IMPORTANT: Return ONLY the rewritten essay. Do not include any commentary, explanations, or additional text. The rewritten essay should be complete and ready to use.`
          },
          {
            role: "user",
            content: `Please rewrite this college essay to achieve a 90%+ writing score and high readability while preserving the author's original ideas and authentic voice:

${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const rewrittenText = response.choices[0]?.message?.content;
      
      if (!rewrittenText) {
        throw new Error('No rewritten content received from OpenAI');
      }

      console.log('✅ AI rewrite complete');
      return rewrittenText;

    } catch (error) {
      console.error('❌ AI rewrite failed:', error);
      throw error;
    }
  }
}

export const openaiService = new OpenAIAnalysisService(); 