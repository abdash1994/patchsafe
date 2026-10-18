'use client'

import type { VulnResult } from '@/lib/types'

interface Props { results: VulnResult[] }

export function SummaryBar({ results }: Props) {
  const c = { Critical: 0, High: 0, Medium: 0, Low: 0, Unknown: 0 }
  for (const r of results) c[r.severityLabel]++
  const kev = results.filter(r => r.kev).length
  const topEpss = Math.max(...results.map(r => r.epss ?? 0), 0)

  const pills = [
    { label: 'Critical', cls: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',      n: c.Critical },
    { label: 'High',     cls: 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30', n: c.High },
    { label: 'Medium',   cls: 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30', n: c.Medium },
    { label: 'Low',      cls: 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30',  n: c.Low },
  ].filter(p => p.n > 0)

  return (
    <div className="glass rounded-xl px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
      <div>
        <span className="text-2xl font-bold text-white">{results.length}</span>
        <span className="ml-2 text-sm text-slate-400">vulnerabilities</span>
      </div>
      <div className="h-6 w-px bg-white/10 hidden sm:block" />
      <div className="flex flex-wrap gap-2">
        {pills.map(p => (
          <span key={p.label} className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${p.cls}`}>
            {p.n} {p.label}
          </span>
        ))}
      </div>
      {kev > 0 && (
        <>
          <div className="h-6 w-px bg-white/10 hidden sm:block" />
          <span className="kev-badge inline-flex items-center gap-1.5 rounded-md bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />
            {kev} actively exploited (CISA KEV)
          </span>
        </>
      )}
      {topEpss > 0 && (
        <>
          <div className="h-6 w-px bg-white/10 hidden sm:block" />
          <span className="text-xs text-slate-400">
            Top exploit probability: <span className="font-semibold text-violet-400">{(topEpss * 100).toFixed(1)}%</span>
          </span>
        </>
      )}
    </div>
  )
}
