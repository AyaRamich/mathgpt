import express from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/authMiddleware.js'


const router = express.Router()


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/api/auth/google/callback' 
}, 
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await prisma.user.findUnique({
      where: { googleId: profile.id }
    })
    
    if(!user) { 
      user= await prisma.user.findUnique ({ 
        where: { email: profile.emails[0].value }
      })
    }
    if(user) { 
      user= await prisma.user.update({
        where : { id: user.id}, 
        data: { 
          googleId: profile.id,
          avatar:profile.photos[0]?.value,
          isVerified:true
        }
      })
    }
    else {
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0]?.value,
          isVerified:true
        }
      })
    }

    return done(null, user)
  } catch (err) {
    console.error("Erreur Prisma dans le callback Google Strategy :", err)
    return done(err, null)
  }
}))

// login
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
)

// callback
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=true`
  }),
  (req, res) => {
    try {
      const accessToken = jwt.sign(
        { userId: req.user.id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const refreshToken = jwt.sign(
        { userId: req.user.id },
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('mathgpt_token', accessToken, {
        httpOnly: true,
        secure: false, 
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      })
      
      res.cookie('mathgpt_refresh_token', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })

      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`)
    } catch (jwtError) {
      console.error("Erreur lors de la génération des tokens :", jwtError)
      res.status(500).redirect('/login?error=token_generation_failed')
    }
  }
)


router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })
    res.json(user)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})


router.post('/logout', (req, res) => {
  res.clearCookie('mathgpt_token')
  res.clearCookie('mathgpt_refresh_token') 
  res.json({ message: 'Logged out' })
})

export default router