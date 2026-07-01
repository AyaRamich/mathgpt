import jwt from 'jsonwebtoken'

export const authRequired = (req, res, next) => {
  const token = req.cookies.mathgpt_token

  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' , code: 'NO_TOKEN' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
     if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ error: 'Token invalide', code: 'INVALID_TOKEN' })
  }
}