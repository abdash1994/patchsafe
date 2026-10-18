const EPSS_URL = 'https://api.first.org/data/v1/epss'
const BATCH_SIZE = 100

export async function fetchEpss(cveIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  if (cveIds.length === 0) return result

  // Batch into groups of BATCH_SIZE
  for (let i = 0; i < cveIds.length; i += BATCH_SIZE) {
    const batch = cveIds.slice(i, i + BATCH_SIZE)
    try {
      const res = await fetch(`${EPSS_URL}?cve=${batch.join(',')}`)
      if (!res.ok) continue
      const data = await res.json()
      for (const entry of data.data ?? []) {
        result.set(entry.cve, parseFloat(entry.epss))
      }
    } catch {
      // partial failure is fine
    }
  }
  return result
}
