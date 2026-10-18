import type { Component, OsvHit, OsvVuln } from './types'

function parseCvssScore(scoreStr: string): number {
  // CVSS:3.1/AV:N/.../score  — the base score is NOT in the vector, we compute approximation
  // OSV sometimes has "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H" without a numeric trailing score
  // Try to extract numeric score from end: "CVSS:3.1/.../10.0"
  const numericMatch = scoreStr.match(/(\d+\.\d+)$/)
  if (numericMatch) return parseFloat(numericMatch[1])
  return 0
}

function preferCve(aliases: string[] | undefined, fallback: string): string {
  if (!aliases) return fallback
  const cve = aliases.find(a => a.startsWith('CVE-'))
  return cve ?? fallback
}

export async function queryOSV(components: Component[]): Promise<OsvHit[]> {
  if (components.length === 0) return []

  const queries = components.map(c => ({
    package: { name: c.name, ecosystem: c.ecosystem },
    version: c.version,
  }))

  let data: { results: Array<{ vulns?: OsvVuln[] }> }
  try {
    const res = await fetch('https://api.osv.dev/v1/querybatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries }),
    })
    if (!res.ok) return []
    data = await res.json()
  } catch {
    return []
  }

  const hits: OsvHit[] = []
  for (let i = 0; i < components.length; i++) {
    const vulns = data.results[i]?.vulns ?? []
    for (const vuln of vulns) {
      const cveId = preferCve(vuln.aliases, vuln.id)
      let severity = 0
      for (const s of vuln.severity ?? []) {
        const score = parseCvssScore(s.score)
        if (score > severity) severity = score
      }
      hits.push({
        component: components[i],
        cveId,
        severity,
        description: (vuln.summary ?? '').slice(0, 200),
        rawVuln: vuln,
      })
    }
  }
  return hits
}
