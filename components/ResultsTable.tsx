'use client'

import { useState, useMemo } from 'react'
import type { VulnResult } from '@/lib/types'
import { SeverityBadge } from './SeverityBadge'

interface Props {
  results: VulnResult[]
}

type SortKey = 'severity' | 'name' | 'cveId' | 'epss'
type SortDir = 'asc' | 'desc'

export function ResultsTable({ results }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('severity')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    const q = filter.toLowerCase()
    return q ? results.filter(r => r.name.toLowerCase().includes(q) || r.cveId.toLowerCase().includes(q)) : results
  }, [results, filter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'severity') cmp = a.severity - b.severity
      else if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'cveId') cmp = a.cveId.localeCompare(b.cveId)
      else if (sortKey === 'epss') cmp = a.epss - b.epss
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [filtered, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortArrow({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 text-gray-600">↕</span>
    return <span className="ml-1 text-blue-400">{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  const thCls = 'cursor-pointer select-none px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-200'

  return (
    <div className="w-full">
      <div className="mb-3">
        <input
          type="text"
          placeholder="Filter by component name or CVE ID..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800 bg-gray-900">
            <tr>
              <th className={thCls} onClick={() => toggleSort('name')}>Component <SortArrow k="name" /></th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Version</th>
              <th className={thCls} onClick={() => toggleSort('cveId')}>CVE <SortArrow k="cveId" /></th>
              <th className={thCls} onClick={() => toggleSort('severity')}>Severity <SortArrow k="severity" /></th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Description</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Fix Version</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">KEV</th>
              <th className={thCls} onClick={() => toggleSort('epss')}>EPSS <SortArrow k="epss" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-950">
            {sorted.map((r, i) => (
              <tr key={`${r.name}-${r.cveId}-${i}`} className="hover:bg-gray-900">
                <td className="px-3 py-3 font-mono text-xs text-gray-200">{r.name}</td>
                <td className="px-3 py-3 font-mono text-xs text-gray-400">{r.version}</td>
                <td className="px-3 py-3">
                  {r.cveId.startsWith('CVE-') ? (
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${r.cveId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-blue-400 hover:underline"
                    >
                      {r.cveId}
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-gray-400">{r.cveId}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <SeverityBadge severity={r.severity} label={r.severityLabel} />
                </td>
                <td className="max-w-xs px-3 py-3 text-xs text-gray-400">{r.description || '—'}</td>
                <td className="px-3 py-3">
                  {r.fixVersion ? (
                    <span className="font-mono text-xs text-green-400">{r.fixVersion}</span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {r.kev ? (
                    <span className="rounded bg-red-900 px-1.5 py-0.5 text-xs font-semibold text-red-300">⚠ Exploited</span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-gray-400">
                  {r.epss > 0 ? `${(r.epss * 100).toFixed(1)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-600">No vulnerabilities match the filter.</div>
        )}
      </div>
    </div>
  )
}
