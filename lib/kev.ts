const KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'

export async function fetchKevSet(): Promise<Set<string>> {
  try {
    const res = await fetch(KEV_URL)
    if (!res.ok) return new Set()
    const data = await res.json()
    const ids = (data.vulnerabilities ?? []).map((v: { cveID: string }) => v.cveID)
    return new Set(ids)
  } catch {
    return new Set()
  }
}

export function isKev(cveId: string, kevSet: Set<string>): boolean {
  return kevSet.has(cveId)
}
