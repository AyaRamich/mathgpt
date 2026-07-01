
import express from 'express'
import { authRequired } from '../middleware/authMiddleware.js'
import prisma from '../lib/prisma.js'

const router = express.Router()

// get all sessions
router.get('/', authRequired, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { 
        messages: { 
          take: 1,
          orderBy: { createdAt: 'asc' }
        } 
      }
    })
    res.json(sessions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// get one session
router.get('/:sessionId', authRequired, async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    })
    if (!session || session.userId !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' })
    }
    res.json(session)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// delete session
router.delete('/:sessionId', authRequired, async (req, res) => {
  try {
    await prisma.message.deleteMany({ 
      where: { sessionId: req.params.sessionId } 
    })
    await prisma.session.delete({ 
      where: { id: req.params.sessionId } 
    })
    res.json({ message: 'Session supprimée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router