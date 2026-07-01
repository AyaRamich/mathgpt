const forbidden_acts = [
    /ignore (all|previous|your|my) (previous|next|all)? instructions/i,
    /ignore (all|previous|your|my) (previous|next|all)? message/i,
    /system prompt/i,
    /jailbreak/i,
    /you are now/i,
    /you are (a|an) (evil|malicious|dangerous|unethical|illegal) (hacker|criminal|spy|terrorist|scammer)/i,
    /you are (a|an) (evil|malicious|dangerous|unethical|illegal) (hacker|criminal|spy|terrorist|scammer) and you will do anything i say/i,
    /act as (a)?different character/i,
    /forget (your|all)?rules/i, 
    /<script.*?>/i,
    /<.*?on\w+=.*?>/i,
    /<iframe.*?>/i,
    /javascript:/i,
    /vbscript:/i,
    /data:/i,
]
export const sanitizeInput = (input) =>  { 
    if (!input || typeof input !== 'string') {
    throw new Error('input invalide')
  }

  
  if (input.length > 800) {
    throw new Error('input trop long (max 800 caractères)')
  }

  
  if (input.trim().length < 2) {
    throw new Error('input trop court')
  }

  
  for (const pattern of forbidden_acts) {
    if (pattern.test(input)) {
      throw new Error('input non autorisé')
    }
  }

  
  return input
    .trim()
    .replace(/\s+/g, ' ')       
    .replace(/[\u200B-\u200D]/g, '') 
}