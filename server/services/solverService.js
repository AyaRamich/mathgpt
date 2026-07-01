import { GoogleGenAI } from "@google/genai"
import { withRetry } from "../lib/retry.js"
import { safeJSONParse } from "../lib/safeJsonParse.js"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const SYSTEM_PROMPT = `You are MathGPT, an expert analytical solver.
The user may write in English, French, Arabic, or Darija.
Return ONLY valid JSON.
Do not use markdown.
Do not use code blocks.
IMPORTANT:
Never cut off the JSON.
Always complete all fields.
If needed, shorten explanations instead of truncating JSON.
- Always use LaTeX commands for math symbols (\infty, \int, \to, \leq...).
Never spell them out as words, and never leave a LaTeX command outside
of $ or $$ delimiters.
Every string must be valid JSON:
{
  "problem_type": "algebraic | financial | statistical | geometric",
  "language_detected": "en | fr | ar",
  "confidence": 0.0,
  "steps": [
    { "step": 1, "explanation": "...", "formula": "...", "result": "..." }
  ],
  "final_answer": "...",
  "graph": {
    "type": "line | bar | scatter | none",
    "data": [],
    "xlabel": "...",
    "ylabel": "..."
  }
}

"confidence" must be a number between 0 and 1 reflecting how sure you are
that final_answer is correct. Be honest — give a low score if the problem
is ambiguous, badly extracted (OCR artifacts), or you're unsure of the method.`

const CONFIDENCE_THRESHOLD = 0.5

export async function solvemath(problem, { historyText = '' } = {}) {
  const contents = []
  if (historyText) {
    contents.push({ text: `Historique de la conversation:\n${historyText}\n\nNouvelle requête:` })
  }
  contents.push({ text: problem })

  const callGemini = async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        maxOutputTokens: 3000,
        responseMimeType: 'application/json'
      }
    })
    const rawText = (response.text || '').trim()
    if (!rawText) throw new Error('Empty response from Gemini')
    return safeJSONParse(rawText)
  }

  // retry sur erreurs transitoires (réseau, 429, JSON cassé)
  let result = await withRetry(callGemini, { retries: 2, baseDelayMs: 600 })

  // check de confiance : si le modèle lui-même n'est pas sûr, on retente une fois
  if (typeof result.confidence === 'number' && result.confidence < CONFIDENCE_THRESHOLD) {
    try {
      const retryResult = await withRetry(callGemini, { retries: 1, baseDelayMs: 600 })
      if (typeof retryResult.confidence === 'number' && retryResult.confidence > result.confidence) {
        result = retryResult
      }
    } catch (e) {
      console.error('Confidence retry failed:', e.message)
    }
  }

  result.low_confidence = typeof result.confidence === 'number' && result.confidence < CONFIDENCE_THRESHOLD
  return result
}