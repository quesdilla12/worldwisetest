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
    return !!(import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here');
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
            content: `You are an expert writing assistant. Analyze the given text and provide detailed feedback in JSON format. Return ONLY valid JSON with this structure:
{
  "suggestions": [
    {
      "type": "grammar|spelling|style|clarity|conciseness|engagement|tone",
      "text": "original text with error",
      "suggestion": "corrected text",
      "explanation": "detailed explanation",
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

Focus on:
- Grammar errors (subject-verb agreement, tense consistency, etc.)
- Spelling mistakes
- Style improvements (word choice, sentence structure)
- Clarity and conciseness
- Tone consistency
- Readability

Be thorough but practical. Only suggest changes that genuinely improve the writing.`
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

      // Add positions to suggestions (simplified - in production you'd need better text matching)
      const suggestionsWithPositions = analysis.suggestions.map((suggestion: any, index: number) => ({
        id: `ai-${index}`,
        ...suggestion,
        position: { start: 0, end: suggestion.text?.length || 0 }, // Simplified positioning
        confidence: suggestion.confidence || 0.8
      }));

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
}

export const openaiService = new OpenAIAnalysisService(); 