# OpenAI API Setup for WordWise AI

## Quick Setup Guide

1. **Create/Edit the environment file:**
   ```bash
   # In the wordwise-ai directory, create or edit .env file
   touch .env
   ```

2. **Add your OpenAI API key to .env:**
   ```env
   VITE_OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here
   ```

3. **Restart the development server:**
   ```bash
   npm run dev
   ```

## How to Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-proj-...`)
6. Paste it in your `.env` file

## How It Works

- **With API Key:** WordWise AI will use GPT-3.5-turbo for advanced analysis including:
  - Sophisticated grammar and spelling detection
  - Style and tone analysis
  - Context-aware suggestions
  - Professional writing feedback

- **Without API Key:** Falls back to local regex-based analysis with:
  - Basic spelling and grammar checks
  - Simple readability analysis
  - Essential error detection

## Security Note

⚠️ **IMPORTANT:** Never commit your API key to version control! 
The `.env` file should be in your `.gitignore` file.

## Test Your Setup

1. Start typing in the editor
2. Check the browser console (F12) for logs
3. Look for: `🤖 Analyzing text with OpenAI...`
4. If you see: `🔧 OpenAI API key not configured, falling back to local analysis` - check your .env file

## Troubleshooting

- Make sure the .env file is in the `wordwise-ai` directory (same level as package.json)
- Restart the dev server after adding the API key
- Check that your API key starts with `sk-proj-`
- Ensure you have OpenAI credits available 