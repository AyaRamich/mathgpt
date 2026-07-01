import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import validator from 'validator'
import prisma from '../lib/prisma.js'
import { Resend } from 'resend'
import { authRequired } from '../middleware/authMiddleware.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const router = express.Router()
const isprod = process.env.NODE_ENV === 'production'

const createTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  )

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { accessToken, refreshToken }
}

const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString()

async function sendVerificationEmail(email, code) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set; skipping verification email.')
    return false
  }

  await resend.emails.send({
    from: 'MathGPT <onboarding@resend.dev>',
    to: email,
    subject: 'Code de vérification MathGPT',
    html: `<p>Votre code de vérification MathGPT est : <strong>${code}</strong></p><p>Entrez-le dans l’application pour activer votre compte.</p>`
  })
  return true
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis.' })
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return res.status(409).json({
        error: existingUser.isVerified
          ? 'Un utilisateur avec cet email existe déjà.'
          : 'Compte non vérifié existant. Vérifiez votre email ou demandez un nouveau code.'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const verificationCode = generateVerificationCode()

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        isVerified: false,
        verificationToken: verificationCode
      }
    })

    const emailSent = await sendVerificationEmail(email, verificationCode)

    return res.json({
      success: true,
      message: emailSent
        ? 'Compte créé. Vérifiez votre email avec le code envoyé.'
        : 'Compte créé. Aucun service email configuré, utilisez le code affiché ci-dessous.',
      debugCode: !emailSent && process.env.NODE_ENV !== 'production' ? verificationCode : undefined
    })
  } catch (err) {
    console.error('Erreur email auth:', err)
    return res.status(500).json({ error: 'Erreur serveur lors de l’enregistrement.' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis.' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Veuillez vérifier votre email avant de vous connecter.' })
    }

    const { accessToken, refreshToken } = createTokens(user)

    res.cookie('mathgpt_token', accessToken, {
      httpOnly: true,
      secure: isprod,
      sameSite: isprod ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    })
    res.cookie('mathgpt_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isprod,
      sameSite: isprod ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.json({ success: true, message: 'Connexion réussie.' })
  } catch (err) {
    console.error('Erreur de login:', err)
    return res.status(500).json({ error: 'Erreur serveur lors de la connexion.' })
  }
})

router.post('/refresh', (req, res) => {
  try {
    const token = req.cookies.mathgpt_refresh_token

    if (!token) {
      return res.status(401).json({ error: 'No refresh token' })
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET)
    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '1d' })

    res.cookie('mathgpt_token', accessToken, {
      httpOnly: true,
      secure: isprod,
      sameSite: isprod ? 'none' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    })

    return res.json({ success: true })
  } catch (err) {
    return res.status(403).json({ error: 'Invalid refresh token' })
  }
})

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email invalide.' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' })
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Compte déjà vérifié.' })
    }

    const verificationCode = generateVerificationCode()
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: verificationCode }
    })

    const emailSent = await sendVerificationEmail(email, verificationCode)

    return res.json({
      success: true,
      message: emailSent
        ? 'Un nouveau code de vérification a été envoyé.'
        : 'Aucun service email configuré, utilisez le code affiché ci-dessous.',
      debugCode: !emailSent && process.env.NODE_ENV !== 'production' ? verificationCode : undefined
    })
  } catch (err) {
    console.error('Erreur resend verification:', err)
    return res.status(500).json({ error: 'Erreur serveur lors de la réinitialisation.' })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const email = req.body?.email || req.query?.email
    const code = req.body?.code || req.query?.code || req.query?.token

    if (!email || !code) {
      return res.status(400).json({ error: 'Email et code de vérification requis.' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(400).json({ error: 'Utilisateur introuvable.' })
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Compte déjà vérifié.' })
    }

    if (String(user.verificationToken || '').trim() !== String(code).trim()) {
      return res.status(400).json({ error: 'Code de vérification invalide.' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null }
    })

    return res.json({ success: true, message: 'Compte vérifié avec succès.' })
  } catch (err) {
    console.error('Erreur de vérification:', err)
    return res.status(500).json({ error: 'Erreur serveur lors de la vérification.' })
  }
})

router.get('/verify', async (req, res) => {
  const email = req.query?.email
  const code = req.query?.code || req.query?.token

  if (!email || !code) {
    return res.status(400).json({ error: 'Email et code de vérification requis.' })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return res.status(400).json({ error: 'Utilisateur introuvable.' })
  }

  if (String(user.verificationToken || '').trim() !== String(code).trim()) {
    return res.status(400).json({ error: 'Code de vérification invalide.' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verificationToken: null }
  })

  return res.json({ success: true, message: 'Compte vérifié avec succès.' })
})

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isVerified: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' })
    }

    return res.json(user)
  } catch (err) {
    console.error('Erreur GET /me:', err)
    return res.status(500).json({ error: 'Erreur serveur.' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('mathgpt_token')
  res.clearCookie('mathgpt_refresh_token')
  res.json({ message: 'Logged out' })
})

export default router
