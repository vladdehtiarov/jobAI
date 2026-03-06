export type OnboardingInput = {
  id: string
  full_name: string
  target_role: string
  target_salary_usd: string
  linkedin_url: string
  consent_enrichment: boolean
}

export function validateOnboarding(input: OnboardingInput): string[] {
  const errors: string[] = []

  if (!input.id || input.id.trim().length < 10) {
    errors.push('User ID is required and must look like UUID.')
  }

  if (!input.full_name || input.full_name.trim().length < 2) {
    errors.push('Full name must contain at least 2 characters.')
  }

  if (!input.target_role || input.target_role.trim().length < 2) {
    errors.push('Target role is required.')
  }

  if (input.target_salary_usd) {
    const salary = Number(input.target_salary_usd)
    if (!Number.isFinite(salary) || salary < 500 || salary > 500000) {
      errors.push('Target salary must be between 500 and 500000 USD.')
    }
  }

  if (input.linkedin_url) {
    try {
      const url = new URL(input.linkedin_url)
      if (!url.hostname.includes('linkedin.com')) {
        errors.push('LinkedIn URL must be a linkedin.com link.')
      }
    } catch {
      errors.push('LinkedIn URL is invalid.')
    }
  }

  if (!input.consent_enrichment) {
    errors.push('Consent is required before external data enrichment.')
  }

  return errors
}
