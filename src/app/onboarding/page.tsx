'use client'
import { useState } from 'react'

export default function OnboardingPage() {
  const [form, setForm] = useState({ full_name:'', target_role:'', target_salary_usd:'', linkedin_url:'' })
  const [saved, setSaved] = useState(false)

  const update = (k: string, v: string) => setForm((s)=>({ ...s, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: wire to API/profile table
    setSaved(true)
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Onboarding</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded p-2" placeholder="Full name" value={form.full_name} onChange={(e)=>update('full_name', e.target.value)} required />
        <input className="w-full border rounded p-2" placeholder="Target role" value={form.target_role} onChange={(e)=>update('target_role', e.target.value)} required />
        <input className="w-full border rounded p-2" type="number" placeholder="Target salary USD" value={form.target_salary_usd} onChange={(e)=>update('target_salary_usd', e.target.value)} />
        <input className="w-full border rounded p-2" type="url" placeholder="LinkedIn URL" value={form.linkedin_url} onChange={(e)=>update('linkedin_url', e.target.value)} />
        <button className="px-4 py-2 rounded bg-black text-white" type="submit">Save</button>
      </form>
      {saved && <p className="text-sm text-green-700">Saved locally. API wiring next batch.</p>}
    </main>
  )
}
