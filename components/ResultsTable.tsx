'use client'

import { useState, useMemo } from 'react'
import type { VulnResult } from '@/lib/types'
import { SeverityBadge } from './SeverityBadge'

interface Props { results: VulnResult[] }
type SortKey = 'severity' | 'name' | 'epss'
type SortDir = 'asc' | 'desc'

function registryUrl(ecosystem: VulnResult['ecosystem'], name: string, version: string): string | null {
  switch (ecosystem) {
    case 'npm':       return `https://www.npmjs.com/package/${name}/v/${version}`
    case 'Maven': {
      const [g, a] = name.split(':')
      if (!g || !a) return null
      return `https://repo1.maven.org/maven2/${g.replace(/\./g, '/')}/${a}/${version}/`
    }
    case 'PyPI':      return `https://pypi.org/project/${name}/${version}/`
    case 'Go':        return `https://pkg.go.dev/${name}@${version}`
    case 'crates.io': return `https://crates.io/crates/${name}/${version}`
    case 'RubyGems':  return `https://rubygems.org/gems/${name}/versions/${version}`
    case 'Packagist': return `https://packagist.org/packages/${name}#${version}`
    case 'NuGet':     return `https://www.nuget.org/packages/${name}/${version}`
    case 'Pub':       return `https://pub.dev/packages/${name}/versions/${version}`
    default:          return null
  }
}

function EpssBar({ value }: { value: number }) {
  const pct = Math.min((value ?? 0) * 100, 100)
  const color = pct >= 50 ? '#ef4444' : pct >= 20 ? '#f97316' : pct >= 5 ? '#eab308' : '#6366f1'
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs w-10 text-right tabular-nums" style={{ color }}>
        {pct > 0 ? `${pct.toFixed(1)}%` : '—'}
      </span>
    </div>
  )
}

function ExpandedRow({ r }: { r: VulnResult }) {
  const url = r.fixVersion ? registryUrl(r.ecosystem, r.name, r.fixVersion) : null
  return (
    <tr className="border-b border-white/4 bg-white/2">
      <td colSpan={5} className="px-5 py-4">
        <div className="grid sm:grid-cols-3 gap-5 text-xs">
          {/* CVE + description */}
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2 flex-wrap">
              {r.cveId.startsWith('CVE-') ? (
                <a href={`https://nvd.nist.gov/vuln/detail/${r.cveId}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                  {r.cveId}
                </a>
              ) : (
                <span className="font-mono text-slate-400">{r.cveId}</span>
              )}
              {r.kev && (
                <span className="kev-badge inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 font-semibold text-red-400 ring-1 ring-red-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />
                  CISA KEV — actively exploited
                </span>
              )}
            </div>
            <p className="text-slate-400 leading-relaxed">{r.description || 'No description available.'}</p>
          </div>

          {/* Fix + EPSS */}
          <div className="space-y-3">
            <div>
              <p className="text-slate-600 uppercase tracking-wider text-[10px] mb-1">Fix Version</p>
              {r.fixVersion ? (
                url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-emerald-400 bg-emerald-400/10 rounded px-2 py-0.5 hover:bg-emerald-400/20 transition-colors">
                    {r.fixVersion}
                    <svg className="h-2.5 w-2.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <span className="font-mono text-emerald-400 bg-emerald-400/10 rounded px-2 py-0.5">{r.fixVersion}</span>
                )
              ) : (
                <span className="text-slate-600">No fix available</span>
              )}
            </div>
            <div>
              <p className="text-slate-600 uppercase tracking-wider text-[10px] mb-1">Exploit Probability (EPSS)</p>
              <EpssBar value={r.epss ?? 0} />
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

export function ResultsTable({ results }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('severity')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState('')
  const [kevOnly, setKevOnly] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const filtered = useMemo(() => {
    let rows = results
    if (kevOnly) rows = rows.filter(r => r.kev)
    const q = filter.toLowerCase().trim()
    if (q) rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.cveId.toLowerCase().includes(q))
    return rows
  }, [results, filter, kevOnly])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'severity') cmp = a.severity - b.severity
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'epss') cmp = (a.epss ?? 0) - (b.epss ?? 0)
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [filtered, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function toggleRow(i: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const kevCount = results.filter(r => r.kev).length

  function Th({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k
    return (
      <th onClick={() => toggleSort(k)}
        className={`cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors ${active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
        {label} <span className={active ? 'text-indigo-400' : 'text-slate-700'}>{active ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
      </th>
    )
  }

  return (
    <div className="space-y-3 fade-up">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Filter by component or CVE…" value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full glass-input rounded-lg pl-9 pr-4 py-2 text-sm outline-none" />
        </div>
        {kevCount > 0 && (
          <button onClick={() => setKevOnly(v => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${kevOnly ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' : 'glass text-slate-400 hover:text-slate-200'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />
            KEV only
          </button>
        )}
        <span className="text-xs text-slate-600">{sorted.length} of {results.length}</span>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/6">
              <th className="w-8 px-3 py-3" />
              <Th k="name" label="Component" />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Version</th>
              <Th k="severity" label="Severity" />
              <Th k="epss" label="EPSS" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const open = expanded.has(i)
              const accentMap: Record<string, string> = { Critical: 'row-critical', High: 'row-high', Medium: 'row-medium', Low: 'row-low' }
              const accentCls = accentMap[r.severityLabel] ?? ''
              return <>
                <tr key={`row-${i}`}
                  onClick={() => toggleRow(i)}
                  className={`border-b border-white/4 cursor-pointer hover:bg-white/3 transition-colors ${accentCls} ${open ? 'bg-white/3' : ''}`}>
                  {/* Expand chevron */}
                  <td className="px-3 py-3 text-center">
                    <span className={`text-slate-600 text-xs transition-transform inline-block ${open ? 'rotate-90' : ''}`}>›</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-200 whitespace-nowrap">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{r.version}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={r.severity} label={r.severityLabel} />
                      {r.kev && <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" title="CISA KEV — actively exploited" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 w-36"><EpssBar value={r.epss ?? 0} /></td>
                </tr>
                {open && <ExpandedRow key={`detail-${i}`} r={r} />}
              </>
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No vulnerabilities match the filter.</div>
        )}
      </div>
      <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>Click any row to see CVE details, description, and fix version link</p>
    </div>
  )
}
