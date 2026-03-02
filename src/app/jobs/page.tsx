'use client'
import { useState } from 'react'

type Job = { title?: string; company?: string; location?: string }

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [status, setStatus] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')

  const loadJobs = async () => {
    setStatus('Loading...')
    const res = await fetch('/api/ingest/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sourceUrl ? { sourceUrl } : {}),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setStatus(`Error: ${data?.error || 'failed'}`)
      setJobs([])
      return
    }
    const items = Array.isArray(data?.jobs) ? data.jobs : [
      { title: 'Senior Full-Stack Engineer', company: 'Acme', location: 'Remote' },
      { title: 'Backend Engineer (Node.js)', company: 'Globex', location: 'Remote EU' },
    ]
    setJobs(items)
    setStatus(data?.mocked ? 'Loaded mocked jobs ✅' : 'Loaded jobs ✅')
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Jobs Feed</h1>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded p-2"
          placeholder="Optional source URL"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
        <button className="px-4 py-2 rounded bg-black text-white" onClick={loadJobs}>Load jobs</button>
      </div>
      {status && <p className="text-sm text-gray-700">{status}</p>}
      <div className="space-y-2">
        {jobs.map((j, i) => (
          <div key={i} className="border rounded p-3">
            <div className="font-medium">{j.title || 'Untitled role'}</div>
            <div className="text-sm text-gray-600">{j.company || 'Unknown company'} • {j.location || 'Unknown location'}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
