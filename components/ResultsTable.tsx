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
  const color = pct >= 50 ? '#ef4444' : pct >= 20 ? '#f97316' : pct >= 5 ? '#ca8a04' : '#6366f1'
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs w-10 text-right tabular-nums font-medium" style={{ color }}>
        {pct > 0 ? `${pct.toFixed(1)}%` : '—'}
      </span>
    </div>
  )
}

function ExpandedRow({ r }: { r: VulnResult }) {
  const url = r.fixVersion ? registryUrl(r.ecosystem, r.name, r.fixVersion) : null
  return (
    <tr className="row-expanded">
      <td colSpan={5} className="px-5 py-5">
        <div className="grid sm:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2 flex-wrap">
              {r.cveId.startsWith('CVE-') ? (
                <a href={`https://nvd.nist.gov/vuln/detail/${r.cveId}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-indigo-500 hover:text-indigo-400 underline underline-offset-2 font-semibold">
                  {r.cveId}
                </a>
              ) : (
                <span className="font-mono t-m">{r.cveId}</span>
              )}
              {r.kev && (
                <span className="kev-badge inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 font-semibold text-red-500 ring-1 ring-red-500/25 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
                  CISA KEV — actively exploited
                </span>
              )}
            </div>
            <p className="t-2 leading-relaxed">{r.description || 'No description available.'}</p>
          </div>
          <div className="space-y-4">
            <div>
              <p className="t-m uppercase tracking-widest text-[10px] font-semibold mb-1.5">Fix Version</p>
              {r.fixVersion ? (
                url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-600 bg-emerald-500/12 rounded-md px-2 py-0.5 font-semibold hover:bg-emerald-500/20 transition-colors ring-1 ring-emerald-500/20">
                    {r.fixVersion}
                    <svg className="h-2.5 w-2.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <span className="font-mono text-emerald-600 bg-emerald-500/12 rounded-md px-2 py-0.5 font-semibold ring-1 ring-emerald-500/20">{r.fixVersion}</span>
                )
              ) : (
                <span className="t-m">No fix available</span>
              )}
            </div>
            <div>
              <p className="t-m uppercase tracking-widest text-[10px] font-semibold mb-1.5">Exploit Probability (EPSS)</p>
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

  const accentMap: Record<string, string> = {
    Critical: 'row-critical', High: 'row-high', Medium: 'row-medium', Low: 'row-low'
  }

  return (
    <div className="space-y-3 fade-up">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 t-m pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Filter by component or CVE…" value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none" />
        </div>
        {kevCount > 0 && (
          <button onClick={() => setKevOnly(v => !v)}
            className={`pill-btn ${kevOnly ? '!bg-red-500/15 !text-red-500 !border-red-500/25' : ''}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
            KEV only
          </button>
        )}
        <span className="count-label">{sorted.length} of {results.length}</span>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="div-h">
              <th className="w-8 px-3" />
              <th className={`th-cell${sortKey === 'name' ? ' active' : ''}`} onClick={() => toggleSort('name')}>
                Component <span>{sortKey === 'name' ? (sortDir === 'desc' ? '↓' : '↑') : <span className="opacity-30">↕</span>}</span>
              </th>
              <th className="th-cell !cursor-default hover:!text-muted" style={{ cursor: 'default' }}>Version</th>
              <th className={`th-cell${sortKey === 'severity' ? ' active' : ''}`} onClick={() => toggleSort('severity')}>
                Severity <span>{sortKey === 'severity' ? (sortDir === 'desc' ? '↓' : '↑') : <span className="opacity-30">↕</span>}</span>
              </th>
              <th className={`th-cell${sortKey === 'epss' ? ' active' : ''}`} onClick={() => toggleSort('epss')}>
                EPSS <span>{sortKey === 'epss' ? (sortDir === 'desc' ? '↓' : '↑') : <span className="opacity-30">↕</span>}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const open = expanded.has(i)
              return <>
                <tr key={`row-${i}`} onClick={() => toggleRow(i)}
                  className={`row-base cursor-pointer ${accentMap[r.severityLabel] ?? ''} ${open ? 'row-expanded !border-b-0' : ''}`}>
                  <td className="px-3 py-3 text-center">
                    <span className={`t-m text-xs transition-transform inline-block select-none ${open ? 'rotate-90' : ''}`}>›</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold t-1 whitespace-nowrap">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs t-m whitespace-nowrap">{r.version}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={r.severity} label={r.severityLabel} />
                      {r.kev && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" title="CISA KEV — actively exploited" />
                      )}
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
          <div className="py-12 text-center text-sm t-m">No vulnerabilities match the filter.</div>
        )}
      </div>
      <p className="text-xs t-d text-center">Click any row to see CVE details, description, and fix version link</p>
    </div>
  )
}
