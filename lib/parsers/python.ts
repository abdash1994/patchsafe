import type { Component } from '../types'

// Parses requirements.txt.
// Pinned (==): use exactly.
// Lower-bounded (>=, ~=, >): extract the bound version as best-effort.
// Unpinned (bare name): skip — no version to look up.

export function parsePython(content: string): Component[] {
  const results: Component[] = []
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith('-') || line.startsWith('http')) continue
    // Strip inline comments and extras: requests[security]>=2.28.0  # comment
    const clean = line.split('#')[0].split(';')[0].trim()
    const name = clean.match(/^([A-Za-z0-9_.\-]+)/)?.[1]
    if (!name) continue

    const pinned = clean.match(/==\s*v?(\d[\d.a-z]+)/)
    if (pinned) {
      results.push({ ecosystem: 'PyPI', name, version: pinned[1], isDirect: true })
      continue
    }

    // Best-effort: take the lower bound version
    const bounded = clean.match(/[>~]=\s*v?(\d[\d.]+)/)
    if (bounded) {
      results.push({ ecosystem: 'PyPI', name, version: bounded[1], isDirect: true })
    }
  }
  return results
}
