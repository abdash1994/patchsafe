import type { Component } from '../types'

function stripRange(v: string): string {
  return v.replace(/^[\^~>=<]+/, '').trim()
}

function isValidVersion(v: string): boolean {
  return /^\d+\.\d+/.test(v)
}

export function parseNpm(content: string): Component[] {
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(content)
  } catch {
    return []
  }

  const results: Component[] = []
  const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
  for (const section of sections) {
    const deps = parsed[section] as Record<string, string> | undefined
    if (!deps) continue
    for (const [name, rawVersion] of Object.entries(deps)) {
      if (typeof rawVersion !== 'string') continue
      const version = stripRange(rawVersion)
      if (!isValidVersion(version)) continue
      results.push({ ecosystem: 'npm', name, version })
    }
  }
  return results
}
