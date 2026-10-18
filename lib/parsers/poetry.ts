import type { Component } from '../types'

// Handles two Python modern formats:
// 1. poetry.lock — TOML-like blocks with name/version
// 2. pyproject.toml — [project] dependencies with pinned ==versions

export function parsePoetryLock(content: string): Component[] {
  const seen = new Set<string>()
  const results: Component[] = []

  // Each [[package]] block
  const blocks = content.split(/^\[\[package\]\]/m)
  for (const block of blocks) {
    const nameMatch = block.match(/^name\s*=\s*"([^"]+)"/m)
    const versionMatch = block.match(/^version\s*=\s*"([^"]+)"/m)
    if (!nameMatch || !versionMatch) continue
    const name = nameMatch[1]
    const version = versionMatch[1]
    if (!version.match(/^\d+\.\d+/)) continue
    const key = `${name}@${version}`
    if (seen.has(key)) continue
    seen.add(key)
    results.push({ ecosystem: 'PyPI', name, version })
  }

  return results
}

export function parsePyproject(content: string): Component[] {
  const seen = new Set<string>()
  const results: Component[] = []

  // Match pinned deps in string form: "requests==2.28.0"
  const pattern = /"([A-Za-z0-9_.\-]+)\s*==\s*v?(\d[\d.]+)"/g
  for (const m of content.matchAll(pattern)) {
    const name = m[1]
    const version = m[2]
    const key = `${name}@${version}`
    if (seen.has(key)) continue
    seen.add(key)
    results.push({ ecosystem: 'PyPI', name, version })
  }

  return results
}
