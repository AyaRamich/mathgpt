import express from 'express'
import helmet from 'helmet'
import dotenv from 'dotenv'
import passport from 'passport'
import authRoute from './routes/auth.js'
import emailAuthRoute from './routes/emailauth.js'
import cors from 'cors'
import solveRoute from './routes/solve.js'
import cookieParser from 'cookie-parser'
import historyRoute from './routes/history.js'




dotenv.config()

const app = express()

app.use(helmet())

app.use(cors({
  origin: process.env.FRONTEND_URL ||'http://localhost:5173',
  credentials:true 
}))
app.use(express.json({limit:'10kb'}))
app.use(cookieParser())
app.use(passport.initialize())
process.on('unhandledRejection', (reason, promise) => {
  console.error('Détail de l\'erreur non gérée :', reason);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})
app.use('/api/auth/email', emailAuthRoute)
app.use('/api/auth', authRoute)
app.use('/api/solve', solveRoute)

app.use('/api/history', historyRoute)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(` mathGPT backend running on port ${PORT}`)
})
