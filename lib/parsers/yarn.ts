import type { Component } from '../types'

// Handles both yarn.lock v1 (classic) and v2/v3 (berry) formats.
// v1 looks like:
//   lodash@^4.17.20:
//     version "4.17.21"
// v2/v3 looks like:
//   "lodash@npm:^4.17.20":
//     version: 4.17.21

export function parseYarnLock(content: string): Component[] {
  const seen = new Set<string>()
  const results: Component[] = []

  // Berry (v2+): YAML-ish format with `resolution:` and `version:` fields
  const isBerry = content.includes('__metadata:')

  if (isBerry) {
    // Each entry block ends at a blank line
    const blocks = content.split(/\n\n+/)
    for (const block of blocks) {
      const versionMatch = block.match(/^  version: (\S+)/m)
      // Extract name from resolution field
      const resolutionMatch = block.match(/^  resolution: "?(@?[^@\n"]+)@/)
      if (!versionMatch || !resolutionMatch) continue
      const name = resolutionMatch[1].trim()
      const version = versionMatch[1].replace(/^"|"$/g, '').trim()
      if (!name || !version || name === '__metadata') continue
      const key = `${name}@${version}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push({ ecosystem: 'npm', name, version })
    }
    return results
  }

  // Classic v1
  const lines = content.split('\n')
  let currentName: string | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) { currentName = null; continue }

    // Entry header: "lodash@^4.17.20, lodash@~4.17.0:" or "@scope/pkg@^1.0.0:"
    if (!raw.startsWith(' ') && line.endsWith(':')) {
      // Pull the package name from the first specifier
      const specifier = line.replace(/:$/, '').split(', ')[0].replace(/^"/, '')
      // Name is everything before the last @
      const atIdx = specifier.lastIndexOf('@')
      currentName = atIdx > 0 ? specifier.slice(0, atIdx) : null
      continue
    }

    // Version line inside a block
    if (currentName && (line.startsWith('version ') || line.startsWith('version:'))) {
      const version = line.replace(/^version:?\s+/, '').replace(/"/g, '').trim()
      if (/^\d+\.\d+/.test(version)) {
        const key = `${currentName}@${version}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push({ ecosystem: 'npm', name: currentName, version })
        }
      }
      currentName = null
    }
  }

  return results
}
