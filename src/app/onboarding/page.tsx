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
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  const update = (k: keyof Form, v: string | boolean) => setForm((s) => ({ ...s, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.consent_enrichment) {
      setStatus('Error: Consent is required before external data enrichment.')
      return
    }

    setStatus('Saving...')
    const payload = {
      id: form.id,
      full_name: form.full_name,
      target_role: form.target_role,
      target_salary_usd: form.target_salary_usd ? Number(form.target_salary_usd) : null,
      linkedin_url: form.linkedin_url || null,
      consent_enrichment: form.consent_enrichment,
      skills: ['typescript', 'nodejs'],
    }

    const saveRes = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const saveData = await saveRes.json().catch(() => ({}))
    if (!saveRes.ok) {
      setStatus(`Error: ${saveData?.error || 'save failed'}`)
      return
    }

    const scoreRes = await fetch('/api/profile/score', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const scoreData = await scoreRes.json().catch(() => ({}))
    if (scoreRes.ok) {
      setMetrics({ score: scoreData.score ?? 0, rationale: scoreData.rationale ?? [] })
    }

    setStatus('Saved to profile API ✅')
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

        <button className="px-4 py-2 rounded bg-black text-white" type="submit">Save</button>
      </form>
      {status && <p className="text-sm text-gray-700">{status}</p>}
      {metrics && <ProfileMetricsCard score={metrics.score} rationale={metrics.rationale} />}
    </main>
  )
}
