type Props = {
  score: number
  rationale: string[]
}

export default function ProfileMetricsCard({ score, rationale }: Props) {
  return (
    <section className="border rounded-lg p-4 space-y-2 bg-white">
      <h2 className="text-lg font-semibold">Profile Metrics</h2>
      <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
        Score: <span className="font-semibold ml-1">{score}/100</span>
      </div>
      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
        {rationale.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </section>
  )
}
