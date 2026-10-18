import type { Component } from '../types'

// Handles package-lock.json lockfileVersion 1, 2, and 3.
// v1: { dependencies: { name: { version, dependencies: {...} } } }
// v2/v3: { packages: { "node_modules/name": { version } } }

export function parsePackageLock(content: string): Component[] {
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(content)
  } catch {
    return []
  }

  const seen = new Set<string>()
  const results: Component[] = []

  function add(name: string, version: string, isDirect = false) {
    if (!name || !version || !version.match(/^\d+\.\d+/)) return
    const key = `${name}@${version}`
    if (seen.has(key)) return
    seen.add(key)
    results.push({ ecosystem: 'npm', name, version, isDirect })
  }

  const lockVersion = (parsed.lockfileVersion as number) ?? 1

  if (lockVersion >= 2 && parsed.packages) {
    // v2/v3: flat packages map, key is "node_modules/foo" or "node_modules/a/node_modules/foo"
    const packages = parsed.packages as Record<string, { version?: string; dev?: boolean }>
    const directKeys = new Set(
      Object.keys((parsed as Record<string, unknown> & { dependencies?: Record<string, unknown> }).dependencies ?? {})
        .map(k => `node_modules/${k}`)
    )
    for (const [key, pkg] of Object.entries(packages)) {
      if (!key || key === '') continue // root package
      const name = key.replace(/^.*node_modules\//, '')
      add(name, pkg.version ?? '', directKeys.has(key))
    }
    return results
  }

  // v1: recursive dependencies tree
  function walkV1(deps: Record<string, { version?: string; dependencies?: Record<string, unknown> }>, isDirect: boolean) {
    for (const [name, dep] of Object.entries(deps)) {
      add(name, dep.version ?? '', isDirect)
      if (dep.dependencies) {
        walkV1(dep.dependencies as Record<string, { version?: string; dependencies?: Record<string, unknown> }>, false)
      }
    }
  }
  if (parsed.dependencies) {
    walkV1(parsed.dependencies as Record<string, { version?: string; dependencies?: Record<string, unknown> }>, true)
  }

  return results
}
