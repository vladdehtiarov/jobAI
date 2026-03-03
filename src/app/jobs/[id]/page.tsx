import Link from 'next/link'

type Job = {
  id: string
  title: string
  company: string
  location: string
  fitScore: number
  rationale: string[]
}

function getMockJob(id: string): Job {
  const jobs: Record<string, Job> = {
    '1': {
      id: '1',
      title: 'Senior Full-Stack Engineer',
      company: 'Acme',
      location: 'Remote',
      fitScore: 88,
      rationale: ['Strong TypeScript/Node match', 'Remote-friendly role', 'Salary band matches target'],
    },
    '2': {
      id: '2',
      title: 'Backend Engineer (Node.js)',
      company: 'Globex',
      location: 'Remote EU',
      fitScore: 81,
      rationale: ['High backend skills overlap', 'Good seniority fit', 'Timezone compatible'],
    },
  }
  return (
    jobs[id] || {
      id,
      title: 'Unknown role',
      company: 'Unknown company',
      location: 'Unknown location',
      fitScore: 70,
      rationale: ['Default fallback explanation'],
    }
  )
}

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = getMockJob(id)

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-5">
      <Link href="/jobs" className="text-sm underline">← Back to Jobs</Link>

      <div className="border rounded-lg p-4 space-y-2">
        <h1 className="text-2xl font-semibold">{job.title}</h1>
        <p className="text-gray-600">{job.company} • {job.location}</p>
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
          Fit score: <span className="font-semibold ml-1">{job.fitScore}%</span>
        </div>
      </div>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-lg font-medium">Why this job fits</h2>
        <ul className="list-disc pl-5 space-y-1">
          {job.rationale.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}
