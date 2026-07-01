export function safeJSONParse(text) {
  try {
    return JSON.parse(text)
  } catch (e) {
    console.error('Broken JSON detected, attempting repair')
    const fixed = text
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
    return JSON.parse(fixed) // si ça throw encore, withRetry va catch et retenter
  }
}