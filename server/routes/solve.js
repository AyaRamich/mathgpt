
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

import { userLimiter } from '../middleware/ratelimit.js'
import { authRequired } from '../middleware/authMiddleware.js'
import { sanitizeInput } from '../middleware/sanitize.js'
import { upload } from '../middleware/upload.js'
import prisma from '../lib/prisma.js'
import { extractmathfromimage } from '../services/ocrService.js'
import { solvemath } from '../services/solverService.js'

const router = express.Router()

router.post('/', authRequired, userLimiter, upload.single('file'), async (req, res) => {
  try {
    const { message, sessionId } = req.body
    const file = req.file   
    
    let problemtext=''
    let userContentForHistory = message || '[Fichier uploadé]'
    let ocrconfidence= null 
    // image
    if (file && file.mimetype.startsWith('image/')) {
      const ocrResult= await extractmathfromimage(file) 
      problemtext=ocrResult.extracted_text ||''
      ocrconfidence=ocrResult.confidence
      console.log ("extracted text:",problemtext, 'confidence = ',ocrconfidence)
      userContentForHistory='[image envoyée]'

    }
    
    // pdf
    else if (file && file.mimetype === 'application/pdf') {
      const pdfResult = await pdfParse(file.buffer)
      const extractedText = pdfResult.text.slice(0, 3000)
      problemtext = `${message ? sanitizeInput(message) + '\n\n' : ''}Contenu du PDF:\n${extractedText}`
      userContentForHistory = message || '[PDF envoyé]'
    } else {
      problemtext = sanitizeInput(message)
      userContentForHistory = problemtext
    }
    
    if (!problemtext.trim()) { 
      return res.status(400).json({erreur : 'aucun contenu exploitable trouvé'})
    }

    
    
    // historique
    let session = null
    let historyText=''
    if (sessionId) {
      session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } }
      })
      if (session?.messages?.length > 0) {
        historyText = session.messages.map(m => `${m.role}: ${m.content}`).join('\n')
      }
    } else {
      session = await prisma.session.create({
        data: { userId: req.userId, title: userContentForHistory.slice(0, 50) }
      })
    }

    setImmediate(async () => { 
      try { 
        await prisma.message.create({
      data: { sessionId: session.id, role: 'user', content: userContentForHistory }
    })
      } catch(e) {
        console.error(e)
      }
    })
    
    
    
    const result = await solvemath (problemtext, {historyText})
    
    if (ocrconfidence!==null) {
      result.ocr_confidence=ocrconfidence
      if(ocrconfidence < 0.5) result.low_confidence= true 
    }

    res.json({...result,sessionId : session.id})

    const sessionIdSafe = session.id
    const resultSafe = result
      setImmediate(async() => { 
        try {
          await prisma.message.create({
             data: {
        sessionId: sessionIdSafe,
        role: 'assistant',
        content: JSON.stringify(resultSafe)
      }
      })
      } catch (e) {
    console.error("DB save error:", e)
      }
        }
      )
      
    } catch (err) {
      console.error('Error in solve route:', err)
      res.status(500).json({ error: 'Erreur serveur lors de la résolution.' })
    }
  })


//stats 
  router.get('/stats', authRequired, async (req, res) => {
  try {
    const totalSessions = await prisma.session.count({ where: { userId: req.userId } })

    const assistantMessages = await prisma.message.findMany({
      where: { session: { userId: req.userId }, role: 'assistant' },
      select: { content: true }
    })

    let byProblemType = {}
    let confidenceSum = 0
    let confidenceCount = 0
    let lowConfidenceCount = 0

    for (const m of assistantMessages) {
      try {
        const parsed = JSON.parse(m.content)
        const type = parsed.problem_type || 'unknown'
        byProblemType[type] = (byProblemType[type] || 0) + 1
        if (typeof parsed.confidence === 'number') {
          confidenceSum += parsed.confidence
          confidenceCount++
          if (parsed.confidence < 0.5) lowConfidenceCount++
        }
      } catch (e) { /* message mal formé, ignoré */ }
    }

    res.json({
      totalSessions,
      totalSolved: assistantMessages.length,
      byProblemType,
      averageConfidence: confidenceCount ? +(confidenceSum / confidenceCount).toFixed(2) : null,
      lowConfidenceCount
    })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ error: 'Erreur serveur lors du calcul des statistiques.' })
  }
})

  export default router