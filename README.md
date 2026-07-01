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

## Screenshots 

### Login 
<img width="523" height="602" alt="Image" src="https://github.com/user-attachments/assets/03261d4e-32f7-45fc-bc29-10e6a159b0fa" />

### Dashboard 

 ***simple equation***
 
<img width="611" height="593" alt="Image" src="https://github.com/user-attachments/assets/23dff15e-4604-4fe2-b247-47c8983c2713" />

***image upload***

<img width="616" height="132" alt="Image" src="https://github.com/user-attachments/assets/b0e93978-7f40-4ee7-aa83-04cda3564c29" />

***ocr solution***

<img width="613" height="582" alt="Image" src="https://github.com/user-attachments/assets/54f39dcb-2ac1-45a7-b74b-087dee22407d" />

##  Run locally
\`\`\`bash
cd server && npm install && node server.js
cd frontend && npm install && npm run dev
\`\`\`
