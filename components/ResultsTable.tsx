'use client'

import { useState, useMemo } from 'react'
import type { VulnResult } from '@/lib/types'
import { SeverityBadge } from './SeverityBadge'

interface Props { results: VulnResult[] }
type SortKey = 'severity' | 'name' | 'cveId' | 'epss'

function registryUrl(ecosystem: VulnResult['ecosystem'], name: string, version: string): string | null {
  switch (ecosystem) {
    case 'npm':
      return `https://www.npmjs.com/package/${name}/v/${version}`
    case 'Maven': {
      // name is "groupId:artifactId"
      const [groupId, artifactId] = name.split(':')
      if (!groupId || !artifactId) return null
      const groupPath = groupId.replace(/\./g, '/')
      return `https://repo1.maven.org/maven2/${groupPath}/${artifactId}/${version}/`
    }
    case 'PyPI':
      return `https://pypi.org/project/${name}/${version}/`
    case 'Go':
      return `https://pkg.go.dev/${name}@${version}`
    case 'crates.io':
      return `https://crates.io/crates/${name}/${version}`
    case 'RubyGems':
      return `https://rubygems.org/gems/${name}/versions/${version}`
    case 'Packagist':
      return `https://packagist.org/packages/${name}#${version}`
    case 'NuGet':
      return `https://www.nuget.org/packages/${name}/${version}`
    case 'Pub':
      return `https://pub.dev/packages/${name}/versions/${version}`
    default:
      return null
  }
}
type SortDir = 'asc' | 'desc'

const rowAccent: Record<string, string> = {
  Critical: 'row-critical',
  High: 'row-high',
  Medium: 'row-medium',
  Low: 'row-low',
}

function EpssBar({ value }: { value: number }) {
  const pct = Math.min(value * 100, 100)
  const color = pct >= 50 ? '#ef4444' : pct >= 20 ? '#f97316' : pct >= 5 ? '#eab308' : '#6366f1'
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs w-10 text-right" style={{ color }}>
        {pct > 0 ? `${pct.toFixed(1)}%` : '—'}
      </span>
    </div>
  )
}

export function ResultsTable({ results }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('severity')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState('')
  const [kevOnly, setKevOnly] = useState(false)

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
      else if (sortKey === 'cveId') cmp = a.cveId.localeCompare(b.cveId)
      else if (sortKey === 'epss') cmp = (a.epss ?? 0) - (b.epss ?? 0)
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [filtered, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function Th({ k, label, right }: { k: SortKey; label: string; right?: boolean }) {
    const active = sortKey === k
    return (
      <th
        onClick={() => toggleSort(k)}
        className={`cursor-pointer select-none px-3 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${right ? 'text-right' : 'text-left'} ${active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
      >
        {label}{' '}
        <span className={active ? 'text-indigo-400' : 'text-slate-600'}>
          {active ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
        </span>
      </th>
    )
  }

  const kevCount = results.filter(r => r.kev).length

  return (
    <div className="space-y-3 fade-up">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter by component or CVE…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full glass rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
        {kevCount > 0 && (
          <button
            onClick={() => setKevOnly(v => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${kevOnly ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' : 'glass text-slate-400 hover:text-slate-200'}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />
            CISA KEV only
          </button>
        )}
        <span className="text-xs text-slate-600">{sorted.length} of {results.length} shown</span>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/6">
              <th className="w-1 px-0" />
              <Th k="name" label="Component" />
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Version</th>
              <Th k="cveId" label="CVE" />
              <Th k="severity" label="Severity" />
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Fix Version</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">KEV</th>
              <Th k="epss" label="EPSS" right />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr
                key={`${r.name}-${r.cveId}-${i}`}
                className={`border-b border-white/4 hover:bg-white/3 transition-colors ${rowAccent[r.severityLabel] ?? ''}`}
              >
                <td className="w-1 px-0" />
                <td className="px-3 py-3 font-mono text-xs text-slate-200 whitespace-nowrap">{r.name}</td>
                <td className="px-3 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{r.version}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {r.cveId.startsWith('CVE-') ? (
                    <a href={`https://nvd.nist.gov/vuln/detail/${r.cveId}`} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 decoration-indigo-400/40">
                      {r.cveId}
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-slate-500">{r.cveId}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <SeverityBadge severity={r.severity} label={r.severityLabel} />
                </td>
                <td className="px-3 py-3 text-xs text-slate-400 max-w-xs">{r.description || '—'}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {r.fixVersion ? (() => {
                    const url = registryUrl(r.ecosystem, r.name, r.fixVersion)
                    return url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Download ${r.name}@${r.fixVersion} from official registry`}
                        className="inline-flex items-center gap-1 font-mono text-xs text-emerald-400 bg-emerald-400/10 rounded px-1.5 py-0.5 hover:bg-emerald-400/20 hover:text-emerald-300 transition-colors"
                      >
                        {r.fixVersion}
                        <svg className="h-2.5 w-2.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-emerald-400 bg-emerald-400/10 rounded px-1.5 py-0.5">{r.fixVersion}</span>
                    )
                  })() : <span className="text-slate-700">—</span>}
                </td>
                <td className="px-3 py-3">
                  {r.kev
                    ? <span className="kev-badge inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />Exploited
                      </span>
                    : <span className="text-slate-700">—</span>}
                </td>
                <td className="px-3 py-3 w-32">
                  <EpssBar value={r.epss ?? 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-600">No vulnerabilities match the filter.</div>
        )}
      </div>
    </div>
  )
}
