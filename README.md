# MathGPT ∑

> AI-powered math solver — algebraic, statistical, financial & geometric problems

##  Live Demo
[mathgpt-khaki.vercel.app](https://mathgpt-khaki.vercel.app)

##  Stack
- **Frontend** : React/Vite, MathJax, Recharts
- **Backend** : Node.js/Express, Prisma, PostgreSQL
- **AI** : Gemini 2.5 Flash (OCR + solver)
- **Auth** : Google OAuth, JWT + refresh tokens

##  Security
- Rate limiting, input sanitization
- httpOnly cookies, token refresh interceptor
- OCR confidence check with auto-retry

##  Run locally
\`\`\`bash
cd server && npm install && node server.js
cd frontend && npm install && npm run dev
\`\`\`
