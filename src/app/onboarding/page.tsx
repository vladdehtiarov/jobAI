'use client'

import { useState } from 'react'
import ProfileMetricsCard from '@/components/profile/ProfileMetricsCard'
import { validateOnboarding } from '@/lib/validation/onboarding'

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
  const [status, setStatus] = useState('')
  const [state, setState] = useState<OnboardingState>('idle')
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  const update = (k: keyof Form, v: string | boolean) => setForm((s) => ({ ...s, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    setMetrics(null)

    if (!form.consent_enrichment) {
      setState('error')
      setStatus('Consent is required before external data enrichment.')
      return
    }

    setState('loading')
    setStatus('Saving onboarding profile...')

    const payload = {
      id: form.id,
      full_name: form.full_name,
      target_role: form.target_role,
      target_salary_usd: form.target_salary_usd ? Number(form.target_salary_usd) : null,
      linkedin_url: form.linkedin_url || null,
      consent_enrichment: form.consent_enrichment,
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
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Onboarding</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded p-2" placeholder="User ID (UUID)" value={form.id} onChange={(e) => update('id', e.target.value)} required />
        <input className="w-full border rounded p-2" placeholder="Full name" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />
        <input className="w-full border rounded p-2" placeholder="Target role" value={form.target_role} onChange={(e) => update('target_role', e.target.value)} required />
        <input className="w-full border rounded p-2" type="number" placeholder="Target salary USD" value={form.target_salary_usd} onChange={(e) => update('target_salary_usd', e.target.value)} />
        <input className="w-full border rounded p-2" type="url" placeholder="LinkedIn URL" value={form.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} />

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.consent_enrichment}
            onChange={(e) => update('consent_enrichment', e.target.checked)}
            className="mt-1"
          />
          <span>
            I consent to external profile enrichment (BringData/Apify providers) for vacancy matching and explainability.
          </span>
        </label>

        <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-60 disabled:cursor-not-allowed" type="submit" disabled={state === 'loading'} data-testid="onboarding-submit">
          {state === 'loading' ? 'Saving...' : 'Save'}
        </button>
      </form>

      {status && (
        <p
          className={`text-sm ${state === 'error' ? 'text-red-700' : 'text-gray-700'}`}
          role={state === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          data-testid="onboarding-status"
        >
          {status}
        </p>
      )}

      {state === 'loading' && (
        <section className="border rounded-lg p-4 bg-gray-50 text-sm text-gray-700" data-testid="onboarding-loading">
          Processing onboarding request...
        </section>
      )}

      {state === 'idle' && !metrics && (
        <section className="border rounded-lg p-4 bg-gray-50 text-sm text-gray-700" data-testid="onboarding-empty">
          Complete the form and submit to generate profile metrics.
        </section>
      )}

      {state === 'error' && !metrics && (
        <section className="border rounded-lg p-4 bg-red-50 text-sm text-red-700" data-testid="onboarding-error">
          We could not complete onboarding. Review the error above and try again.
        </section>
      )}

      {state === 'success' && metrics && <ProfileMetricsCard score={metrics.score} rationale={metrics.rationale} />}
    </main>
  )
}
