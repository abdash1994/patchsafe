import type { Component, OsvHit, OsvVuln } from './types'

// OSV querybatch returns stub objects (id + modified only).
// We fetch each unique vuln ID's full record in parallel batches.

const SEVERITY_LABEL_TO_SCORE: Record<string, number> = {
  CRITICAL: 9.5,
  HIGH: 7.5,
  MODERATE: 5.5,
  MEDIUM: 5.5,
  LOW: 2.5,
}

function parseCvssScore(scoreStr: string): number {
  const numericMatch = scoreStr.match(/(\d+\.\d+)$/)
  if (numericMatch) return parseFloat(numericMatch[1])
  return 0
}

function severityFromVuln(vuln: OsvVuln): number {
  for (const s of vuln.severity ?? []) {
    const score = parseCvssScore(s.score)
    if (score > 0) return score
  }
  const label = vuln.database_specific?.severity?.toUpperCase()
  if (label && SEVERITY_LABEL_TO_SCORE[label]) return SEVERITY_LABEL_TO_SCORE[label]
  return 0
}

function preferCve(aliases: string[] | undefined, fallback: string): string {
  if (!aliases) return fallback
  return aliases.find(a => a.startsWith('CVE-')) ?? fallback
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

// Fetch up to concurrency at a time
async function fetchVulnsBatched(ids: string[], concurrency = 20): Promise<Map<string, OsvVuln>> {
  const result = new Map<string, OsvVuln>()
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency)
    const vulns = await Promise.all(batch.map(fetchVuln))
    for (let j = 0; j < batch.length; j++) {
      const v = vulns[j]
      if (v) result.set(batch[j], v)
    }
  }
  return result
}

// Deduplicate components before querying: same (ecosystem, name, version) → query once, assign to all
function deduplicateComponents(components: Component[]): {
  unique: Component[]
  // maps unique index → all original indices that share it
  indexMap: Map<number, number[]>
} {
  const keyToUniqueIdx = new Map<string, number>()
  const unique: Component[] = []
  const indexMap = new Map<number, number[]>()

  for (let i = 0; i < components.length; i++) {
    const c = components[i]
    const key = `${c.ecosystem}::${c.name}::${c.version}`
    let uid = keyToUniqueIdx.get(key)
    if (uid === undefined) {
      uid = unique.length
      unique.push(c)
      keyToUniqueIdx.set(key, uid)
      indexMap.set(uid, [])
    }
    indexMap.get(uid)!.push(i)
  }

  return { unique, indexMap }
}

export async function queryOSV(components: Component[]): Promise<OsvHit[]> {
  if (components.length === 0) return []

  // Deduplicate first — lockfiles repeat the same transitive dep many times
  const { unique } = deduplicateComponents(components)

  // Cap at 500 unique components per scan to stay within 30s timeout
  const capped = unique.slice(0, 500)

  const queries = capped.map(c => ({
    package: { name: c.name, ecosystem: c.ecosystem },
    version: c.version,
  }))

  // Step 1: batch query for vuln ID stubs
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

  // Step 2: build id → component mapping (keep first component for each vuln ID)
  const idToComponent = new Map<string, Component>()
  for (let i = 0; i < capped.length; i++) {
    for (const stub of batchData.results[i]?.vulns ?? []) {
      if (!idToComponent.has(stub.id)) {
        idToComponent.set(stub.id, capped[i])
      }
    }
  }

  // Step 3: fetch full vuln records in batches of 20
  const ids = [...idToComponent.keys()]
  const vulnMap = await fetchVulnsBatched(ids)

  const hits: OsvHit[] = []
  for (const [id, vuln] of vulnMap) {
    const component = idToComponent.get(id)!
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
