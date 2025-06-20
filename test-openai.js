// Test script to verify OpenAI integration
import { openaiService } from './src/services/openaiService.js';

const testText = "I beleive that technology have changed our lifes dramatically.";

console.log('🧪 Testing OpenAI integration...');
console.log('📝 Test text:', testText);

try {
  const result = await openaiService.analyzeText(testText);
  if (result) {
    console.log('✅ OpenAI integration working!');
    console.log('📊 Suggestions found:', result.suggestions.length);
    console.log('🎯 Writing score:', result.writingScore.score);
    console.log('📖 Readability:', result.readability.gradeLevel);
  } else {
    console.log('⚠️ OpenAI returned null - check API key');
  }
} catch (error) {
  console.error('❌ OpenAI test failed:', error.message);
} 