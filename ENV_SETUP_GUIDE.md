# Environment Setup Guide

## Local Development

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your Gemini API key:
```
VITE_GEMINI_API_KEY=your_actual_api_key_here
GEMINI_API_KEY=your_actual_api_key_here
```

3. Install dependencies and run:
```bash
npm install
npm run dev
```

## Netlify Environment Variables Setup

### For the Main Vite App (React):
1. Go to Netlify Dashboard → Your Site → Site Settings → Build & Deploy → Environment
2. Add new environment variables:
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** `your_gemini_api_key_here`

### For EduHub Assistant HTML (project/index.html):
1. Go to Netlify Dashboard → Your Site → Site Settings → Build & Deploy → Environment
2. Add new environment variables:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `your_gemini_api_key_here`

## Important Notes

- ✅ API keys are stored ONLY in .env (local) and Netlify Environment Variables (production)
- ✅ .env files are in .gitignore - they will NOT be committed to GitHub
- ✅ Use different keys for development and production if desired
- ✅ The HTML file uses `window.__GEMINI_API_KEY__` placeholder that gets injected at deployment

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Click "Get API Key"
3. Copy the generated key
4. Add to .env and Netlify Environment Variables

## Pushing to GitHub

All API keys are removed from the codebase:
```bash
git add .
git commit -m "Remove API keys, add environment configuration"
git push origin main
```

The repository is now safe to push publicly - all sensitive data uses environment variables.
