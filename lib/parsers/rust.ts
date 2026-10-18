import type { Component } from '../types'

export function parseRust(content: string): Component[] {
  const results: Component[] = []
  let inDepsSection = false

  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('[')) {
      inDepsSection = line === '[dependencies]' || line === '[dev-dependencies]' || line === '[build-dependencies]'
      continue
    }
    if (!inDepsSection || !line || line.startsWith('#')) continue

    // Simple: serde = "1.0.160"
    const simple = line.match(/^([A-Za-z0-9_\-]+)\s*=\s*"([^"]+)"/)
    if (simple) {
      const version = simple[2].replace(/^[\^~>=]+/, '')
      if (/^\d+\.\d+/.test(version)) {
        results.push({ ecosystem: 'crates.io', name: simple[1], version })
      }
      continue
    }

    // Table: serde = { version = "1.0.160", ... }
    const table = line.match(/^([A-Za-z0-9_\-]+)\s*=\s*\{[^}]*version\s*=\s*"([^"]+)"/)
    if (table) {
      const version = table[2].replace(/^[\^~>=]+/, '')
      if (/^\d+\.\d+/.test(version)) {
        results.push({ ecosystem: 'crates.io', name: table[1], version })
      }
    }
  }
  return results
}
