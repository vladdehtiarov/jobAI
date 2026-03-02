export function buildIdempotencyKey(parts: Array<string | number | undefined | null>): string {
  const normalized = parts.map((p) => String(p ?? '')).join('::')
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i)
    hash |= 0
  }
  return `idem_${Math.abs(hash)}`
}
