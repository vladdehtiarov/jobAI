'use client'

import { useState } from 'react'
import ProfileMetricsCard from '@/components/profile/ProfileMetricsCard'

type Form = {
  id: string
  full_name: string
  target_role: string
  target_salary_usd: string
  linkedin_url: string
  consent_enrichment: boolean
}

type Metrics = {
  score: number
  rationale: string[]
}

type RequestResult<T> = {
  ok: boolean
  status: number | null
  data: T | null
  error: string | null
}

type OnboardingState = 'idle' | 'loading' | 'success' | 'error'

const REQUEST_TIMEOUT_MS = 15000

async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function requestJson<T>(url: string, payload: unknown): Promise<RequestResult<T>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const data = await safeJson(response)

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data: null,
        error: data && typeof data === 'object' && 'error' in data ? String(data.error) : `Request failed with status ${response.status}`,
      }
    }

    return {
      ok: true,
      status: response.status,
      data: data as T,
      error: null,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        ok: false,
        status: null,
        data: null,
        error: 'Request timed out. Please try again.',
      }
    }

    return {
      ok: false,
      status: null,
      data: null,
      error: 'Network error. Please check your connection and retry.',
    }
  } finally {
    clearTimeout(timeout)
  }
}

export default function OnboardingPage() {
  const [form, setForm] = useState<Form>({
    id: '00000000-0000-0000-0000-000000000000',
    full_name: '',
    target_role: '',
    target_salary_usd: '',
    linkedin_url: '',
    consent_enrichment: false,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [status, setStatus] = useState('')
  const [state, setState] = useState<OnboardingState>('idle')
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  const update = (k: keyof Form, v: string | boolean) => {
    setForm((s) => ({ ...s, [k]: v }))
    if (errors[k]) {
      setErrors((prev) => ({ ...prev, [k]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Form, string>> = {}

    // Full name validation (no numbers allowed)
    if (!form.full_name.trim()) {
      newErrors.full_name = 'Full name is required.'
    } else if (form.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters.'
    } else if (/\d/.test(form.full_name)) {
      newErrors.full_name = 'Full name cannot contain numbers.'
    }

    // Target role validation
    if (!form.target_role.trim()) {
      newErrors.target_role = 'Target role is required.'
    }

    // Salary validation (input restrictions handled via onKeyDown)
    if (form.target_salary_usd && isNaN(Number(form.target_salary_usd))) {
      newErrors.target_salary_usd = 'Salary must be a valid number.'
    } else if (form.target_salary_usd && Number(form.target_salary_usd) <= 0) {
      newErrors.target_salary_usd = 'Salary must be greater than 0.'
    }

    // LinkedIn URL validation (block homepage-only URLs)
    if (form.linkedin_url) {
      const isJustHomepage = /^https?:\/\/(www\.)?linkedin\.com\/?$/i.test(form.linkedin_url.trim())

      if (isJustHomepage) {
        newErrors.linkedin_url = 'Please provide your profile URL, not just the homepage.'
      } else if (!/^https?:\/\/(www\.)?linkedin\.com\/.*$/.test(form.linkedin_url.trim())) {
        newErrors.linkedin_url = 'Must be a valid LinkedIn URL.'
      }
    }

    // Consent validation
    if (!form.consent_enrichment) {
      newErrors.consent_enrichment = 'Consent is required to proceed.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMetrics(null)
    setStatus('')

    if (!validateForm()) {
      setState('error')
      setStatus('Please fix the validation errors below.')
      return
    }

    setState('loading')
    setStatus('Saving onboarding profile...')

    const payload = {
      ...form,
      target_salary_usd: form.target_salary_usd ? Number(form.target_salary_usd) : null,
      linkedin_url: form.linkedin_url || null,
      skills: ['typescript', 'nodejs'],
    }

    const saveResult = await requestJson<{ error?: string }>('/api/profile', payload)
    if (!saveResult.ok) {
      setState('error')
      setStatus(saveResult.error || 'Failed to save onboarding profile.')
      return
    }

    setStatus('Profile saved. Calculating profile metrics...')
    const scoreResult = await requestJson<{ score?: number; rationale?: string[]; error?: string }>('/api/profile/score', payload)

    if (!scoreResult.ok) {
      setState('error')
      setStatus(scoreResult.error || 'Profile saved, but scoring failed.')
      return
    }

    const score = typeof scoreResult.data?.score === 'number' ? scoreResult.data.score : 0
    const rationale = Array.isArray(scoreResult.data?.rationale) ? scoreResult.data.rationale : []

    setMetrics({ score, rationale })
    setState('success')
    setStatus('Onboarding saved and scored successfully ✅')
  }

  return (
      <div className="min-h-screen bg-gray-950 grid place-items-center p-4 text-gray-100 font-sans">
        <main className="w-full max-w-xl bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-8 sm:p-10 space-y-8">

          {/* Header Section */}
          <header className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Onboarding
            </h1>
            <p className="text-sm text-gray-400">
              Complete your profile to unlock tailored opportunities.
            </p>
          </header>

          <form onSubmit={submit} className="space-y-6" noValidate>

            {/* Account ID - Read Only */}
            <div className="space-y-1.5">
              <label htmlFor="account_id" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Account ID
              </label>
              <input
                  id="account_id"
                  className="w-full border border-gray-800 rounded-xl p-3 bg-gray-950 text-gray-500 cursor-not-allowed outline-none"
                  value={form.id}
                  disabled
                  readOnly
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <input
                  id="full_name"
                  className={`w-full border rounded-xl p-3 bg-gray-950 text-gray-100 placeholder-gray-600 transition-all outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                      errors.full_name ? 'border-red-500/50 focus:ring-red-500' : 'border-gray-800'
                  }`}
                  placeholder="e.g. Jane Doe"
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
              />
              {errors.full_name && (
                  <p className="text-red-400 text-xs font-medium pl-1">{errors.full_name}</p>
              )}
            </div>

            {/* Target Role */}
            <div className="space-y-1.5">
              <label htmlFor="target_role" className="block text-sm font-medium text-gray-300">
                Target Role
              </label>
              <input
                  id="target_role"
                  className={`w-full border rounded-xl p-3 bg-gray-950 text-gray-100 placeholder-gray-600 transition-all outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                      errors.target_role ? 'border-red-500/50 focus:ring-red-500' : 'border-gray-800'
                  }`}
                  placeholder="e.g. Senior Frontend Engineer"
                  value={form.target_role}
                  onChange={(e) => update('target_role', e.target.value)}
              />
              {errors.target_role && (
                  <p className="text-red-400 text-xs font-medium pl-1">{errors.target_role}</p>
              )}
            </div>

            {/* Split Row: Salary & LinkedIn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="target_salary_usd" className="block text-sm font-medium text-gray-300">
                  Target Salary (USD)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                  <input
                      id="target_salary_usd"
                      className={`w-full border rounded-xl py-3 pl-8 pr-3 bg-gray-950 text-gray-100 placeholder-gray-600 transition-all outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                          errors.target_salary_usd ? 'border-red-500/50 focus:ring-red-500' : 'border-gray-800'
                      }`}
                      type="number"
                      min="0"
                      placeholder="120000"
                      value={form.target_salary_usd}
                      onChange={(e) => update('target_salary_usd', e.target.value)}
                      onKeyDown={(e) => {
                        // Prevent typing minus, plus, and exponent symbols
                        if (['-', '+', 'e', 'E'].includes(e.key)) {
                          e.preventDefault()
                        }
                      }}
                  />
                </div>
                {errors.target_salary_usd && (
                    <p className="text-red-400 text-xs font-medium pl-1">{errors.target_salary_usd}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-300">
                  LinkedIn Profile
                </label>
                <input
                    id="linkedin_url"
                    className={`w-full border rounded-xl p-3 bg-gray-950 text-gray-100 placeholder-gray-600 transition-all outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                        errors.linkedin_url ? 'border-red-500/50 focus:ring-red-500' : 'border-gray-800'
                    }`}
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={form.linkedin_url}
                    onChange={(e) => update('linkedin_url', e.target.value)}
                />
                {errors.linkedin_url && (
                    <p className="text-red-400 text-xs font-medium pl-1">{errors.linkedin_url}</p>
                )}
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="pt-2">
              <label className="relative flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                      type="checkbox"
                      checked={form.consent_enrichment}
                      onChange={(e) => update('consent_enrichment', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-700 bg-gray-950 text-purple-600 focus:ring-purple-600 focus:ring-offset-gray-900 transition-all"
                      disabled={state === 'loading'}
                  />
                </div>
                <div className="flex flex-col">
                <span className={`text-sm font-medium transition-colors ${
                    errors.consent_enrichment ? 'text-red-400' : 'text-gray-300 group-hover:text-gray-100'
                }`}>
                  I consent to external profile enrichment for matching.
                </span>
                  {errors.consent_enrichment && (
                      <span className="text-red-400 text-xs mt-1">{errors.consent_enrichment}</span>
                  )}
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                  className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-bold tracking-wide hover:bg-purple-500 active:bg-purple-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all shadow-lg shadow-purple-900/30"
                  type="submit"
                  disabled={state === 'loading'}
              >
                {state === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
                ) : (
                    'Complete Onboarding'
                )}
              </button>
            </div>
          </form>

          {/* Status Messages */}
          {status && (
              <div className={`p-4 rounded-xl text-center text-sm font-medium border ${
                  state === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      state === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}>
                {status}
              </div>
          )}

          {/* Empty State / Metrics State */}
          {state === 'idle' && !metrics && (
              <div className="border border-dashed border-gray-800 rounded-xl p-8 text-center bg-gray-900/50">
                <p className="text-gray-500 text-sm">Please fill out the form above to proceed.</p>
              </div>
          )}

          {state === 'success' && metrics && (
              <div className="pt-8 border-t border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ProfileMetricsCard score={metrics.score} rationale={metrics.rationale} />
              </div>
          )}

        </main>
      </div>
  )
}