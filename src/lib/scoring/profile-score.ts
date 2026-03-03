export type ProfileInput = {
  target_role?: string | null
  target_salary_usd?: number | null
  linkedin_url?: string | null
  skills?: string[] | null
}

export type ProfileScoreResult = {
  score: number
  rationale: string[]
}

export function scoreProfile(input: ProfileInput): ProfileScoreResult {
  let score = 0
  const rationale: string[] = []

  if (input.target_role) {
    score += 20
    rationale.push('Target role is defined')
  }
  if (input.linkedin_url) {
    score += 20
    rationale.push('LinkedIn profile URL provided')
  }
  if (typeof input.target_salary_usd === 'number' && input.target_salary_usd > 0) {
    score += 20
    rationale.push('Target salary set')
  }
  if (Array.isArray(input.skills)) {
    const skillPoints = Math.min(input.skills.length * 4, 40)
    score += skillPoints
    rationale.push(`Skills listed: ${input.skills.length}`)
  }

  score = Math.max(0, Math.min(100, score))
  return { score, rationale }
}
