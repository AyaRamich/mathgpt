export async function withRetry(fn, { retries = 2, baseDelayMs = 500 } = {}) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      console.error(`Attempt ${attempt + 1}/${retries + 1} failed:`, err.message)
      if (attempt === retries) break
      const delay = baseDelayMs * Math.pow(2, attempt) // backoff exponentiel
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastError
}