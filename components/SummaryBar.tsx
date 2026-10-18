'use client'

import type { VulnResult } from '@/lib/types'

interface Props {
  results: VulnResult[]
}

export function SummaryBar({ results }: Props) {
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, Unknown: 0 }
  for (const r of results) counts[r.severityLabel]++

  const pills = [
    { label: 'Critical', color: 'bg-red-600 text-white', count: counts.Critical },
    { label: 'High', color: 'bg-orange-500 text-white', count: counts.High },
    { label: 'Medium', color: 'bg-yellow-400 text-gray-900', count: counts.Medium },
    { label: 'Low', color: 'bg-green-500 text-white', count: counts.Low },
  ].filter(p => p.count > 0)

  const kevCount = results.filter(r => r.kev).length

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-sm">
      <span className="font-semibold text-gray-300">{results.length} vulnerabilities found</span>
      <span className="text-gray-600">·</span>
      {pills.map(p => (
        <span key={p.label} className={`rounded px-2 py-0.5 font-semibold ${p.color}`}>
          {p.count} {p.label}
        </span>
      ))}
      {kevCount > 0 && (
        <>
          <span className="text-gray-600">·</span>
          <span className="rounded bg-red-900 px-2 py-0.5 font-semibold text-red-300">
            {kevCount} actively exploited (KEV)
          </span>
        </>
      )}
    </div>
  )
}
