export async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseMs = 300): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i === retries) break
      const delay = baseMs * 2 ** i
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}
