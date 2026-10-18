import type { Component, OsvHit, OsvVuln } from './types'

// OSV querybatch returns stub objects (id + modified only).
// We must fetch each vuln's full record individually to get severity, aliases, and affected ranges.

const SEVERITY_LABEL_TO_SCORE: Record<string, number> = {
  CRITICAL: 9.5,
  HIGH: 7.5,
  MODERATE: 5.5,
  MEDIUM: 5.5,
  LOW: 2.5,
}

function parseCvssScore(scoreStr: string): number {
  // Some OSV entries append the numeric base score: "CVSS:3.1/.../10.0"
  const numericMatch = scoreStr.match(/(\d+\.\d+)$/)
  if (numericMatch) return parseFloat(numericMatch[1])
  return 0
}

function severityFromVuln(vuln: OsvVuln): number {
  // 1. Try numeric CVSS score from severity array
  for (const s of vuln.severity ?? []) {
    const score = parseCvssScore(s.score)
    if (score > 0) return score
  }
  // 2. Fall back to database_specific.severity label (GitHub Advisory schema)
  const label = vuln.database_specific?.severity?.toUpperCase()
  if (label && SEVERITY_LABEL_TO_SCORE[label]) return SEVERITY_LABEL_TO_SCORE[label]
  return 0
}

function preferCve(aliases: string[] | undefined, fallback: string): string {
  if (!aliases) return fallback
  const cve = aliases.find(a => a.startsWith('CVE-'))
  return cve ?? fallback
}

async function fetchVuln(id: string): Promise<OsvVuln | null> {
  try {
    const res = await fetch(`https://api.osv.dev/v1/vulns/${id}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function queryOSV(components: Component[]): Promise<OsvHit[]> {
  if (components.length === 0) return []

  const queries = components.map(c => ({
    package: { name: c.name, ecosystem: c.ecosystem },
    version: c.version,
  }))

  // Step 1: batch query to get vuln ID stubs
  let batchData: { results: Array<{ vulns?: Array<{ id: string }> }> }
  try {
    const res = await fetch('https://api.osv.dev/v1/querybatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries }),
    })
    if (!res.ok) return []
    batchData = await res.json()
  } catch {
    return []
  }

  // Step 2: collect unique IDs and fetch full records in parallel (cap at 50 to stay within timeout)
  const idToComponent = new Map<string, Component>()
  for (let i = 0; i < components.length; i++) {
    for (const stub of batchData.results[i]?.vulns ?? []) {
      if (!idToComponent.has(stub.id)) {
        idToComponent.set(stub.id, components[i])
      }
    }
  }

  const ids = [...idToComponent.keys()].slice(0, 50)
  const fullVulns = await Promise.all(ids.map(fetchVuln))

  const hits: OsvHit[] = []
  for (let i = 0; i < ids.length; i++) {
    const vuln = fullVulns[i]
    if (!vuln) continue
    const component = idToComponent.get(ids[i])!
    hits.push({
      component,
      cveId: preferCve(vuln.aliases, vuln.id),
      severity: severityFromVuln(vuln),
      description: (vuln.summary ?? '').slice(0, 200),
      rawVuln: vuln,
    })
  }
  return hits
}
