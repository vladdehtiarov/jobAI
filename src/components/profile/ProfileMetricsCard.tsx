type Props = {
    score: number
    rationale: string[]
}

export default function ProfileMetricsCard({ score, rationale }: Props) {
    // Helper to color-code the score badge
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
        if (s >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
        return 'text-red-400 border-red-500/30 bg-red-500/10'
    }

    return (
        <section className="border border-gray-800 rounded-lg p-5 space-y-4 bg-gray-950 shadow-inner">
            <h2 className="text-lg font-semibold text-gray-100">Profile Metrics</h2>

            <div className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm ${getScoreColor(score)}`}>
                Score: <span className="font-bold ml-1">{score}/100</span>
            </div>

            {/* Changed text-gray-700 to text-gray-300, and colored the bullet points purple */}
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2 marker:text-purple-500">
                {rationale.map((r, i) => (
                    <li key={i} className="pl-1">{r}</li>
                ))}
            </ul>
        </section>
    )
}