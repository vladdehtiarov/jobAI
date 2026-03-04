type Entry = { createdAt: number; response: unknown }

const store = new Map<string, Entry>()

export function getIdempotentResponse(key: string, ttlMs = 10 * 60_000) {
  const now = Date.now()
  const found = store.get(key)
  if (!found) return null
  if (now - found.createdAt > ttlMs) {
    store.delete(key)
    return null
  }
  return found.response
}

export function setIdempotentResponse(key: string, response: unknown) {
  store.set(key, { createdAt: Date.now(), response })
}
