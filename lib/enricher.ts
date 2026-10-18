import type { Component, VulnResult } from './types'
import { queryOSV } from './osv'
import { fetchKevSet, isKev } from './kev'
import { fetchEpss } from './epss'
import { extractFixVersion } from './deps-dev'

function severityLabel(score: number): VulnResult['severityLabel'] {
  if (score >= 9) return 'Critical'
  if (score >= 7) return 'High'
  if (score >= 4) return 'Medium'
  if (score > 0) return 'Low'
  return 'Unknown'
}

function unique(arr: string[]): string[] {
  return [...new Set(arr)]
}

export async function enrich(components: Component[]): Promise<VulnResult[]> {
  // Fan out: KEV and OSV in parallel
  const [kevSet, osvHits] = await Promise.all([
    fetchKevSet(),
    queryOSV(components),
  ])

  const allCveIds = unique(osvHits.map(h => h.cveId).filter(id => id.startsWith('CVE-')))
  const epssMap = await fetchEpss(allCveIds)

  const results: VulnResult[] = osvHits.map(hit => ({
    name: hit.component.name,
    version: hit.component.version,
    cveId: hit.cveId,
    severity: hit.severity,
    severityLabel: severityLabel(hit.severity),
    description: hit.description,
    fixVersion: extractFixVersion(hit.rawVuln),
    kev: isKev(hit.cveId, kevSet),
    epss: epssMap.get(hit.cveId) ?? 0,
  }))

  // Sort by severity descending, then KEV first within same severity
  results.sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity
    return (b.kev ? 1 : 0) - (a.kev ? 1 : 0)
  })

  return results
}
