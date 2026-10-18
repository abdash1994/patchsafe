import type { Component } from '../types'

export function parsePython(content: string): Component[] {
  const results: Component[] = []
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith('-')) continue
    // Only handle pinned == versions
    const match = line.match(/^([A-Za-z0-9_.\-]+)==(\S+)/)
    if (!match) continue
    const [, name, version] = match
    results.push({ ecosystem: 'PyPI', name, version })
  }
  return results
}
