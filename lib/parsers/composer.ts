import type { Component } from '../types'

// Parses composer.lock — PHP/Composer lockfile.
// JSON format with "packages" and "packages-dev" arrays.
// Each entry: { name: "vendor/package", version: "v1.2.3" }

export function parseComposerLock(content: string): Component[] {
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(content)
  } catch {
    return []
  }

  const seen = new Set<string>()
  const results: Component[] = []

  function processEntries(entries: unknown[], isDirect: boolean) {
    if (!Array.isArray(entries)) return
    for (const pkg of entries) {
      const p = pkg as Record<string, string>
      const name = p.name
      // Composer versions often have "v" prefix: "v1.2.3" → "1.2.3"
      const version = (p.version ?? '').replace(/^v/, '')
      if (!name || !version.match(/^\d+\.\d+/)) continue
      const key = `${name}@${version}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push({ ecosystem: 'Packagist', name, version, isDirect })
    }
  }

  processEntries(parsed.packages as unknown[], true)
  processEntries(parsed['packages-dev'] as unknown[], false)

  return results
}
