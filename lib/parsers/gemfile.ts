import type { Component } from '../types'

// Parses Gemfile.lock — the authoritative lockfile for Ruby/Bundler.
// Structure:
//   GEM
//     remote: https://rubygems.org/
//     specs:
//       rails (7.0.4)
//         actioncable (= 7.0.4)
//       ...

export function parseGemfileLock(content: string): Component[] {
  const seen = new Set<string>()
  const results: Component[] = []
  let inSpecs = false

  for (const raw of content.split('\n')) {
    const line = raw.trimEnd()

    if (line === '  specs:') { inSpecs = true; continue }
    // A section header (no leading spaces, or different section)
    if (inSpecs && line !== '' && !line.startsWith(' ')) { inSpecs = false; continue }

    if (!inSpecs) continue

    // Direct spec line: "    name (version)" — 4-space indent
    const match = raw.match(/^    ([A-Za-z0-9_.\-]+) \(([^)]+)\)/)
    if (!match) continue
    const name = match[1]
    const version = match[2]
    // Skip version constraints like ">= 1.0"
    if (!version.match(/^\d+\.\d+/)) continue
    const key = `${name}@${version}`
    if (seen.has(key)) continue
    seen.add(key)
    results.push({ ecosystem: 'RubyGems', name, version })
  }

  return results
}
