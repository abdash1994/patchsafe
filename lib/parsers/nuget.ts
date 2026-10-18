import type { Component } from '../types'

// Handles multiple .NET dependency formats:
// 1. packages.config  — XML: <package id="..." version="..." />
// 2. *.csproj / *.fsproj / *.vbproj — XML: <PackageReference Include="..." Version="..." />
// 3. packages.lock.json — NuGet lockfile (v1): { "dependencies": { "net6.0": { "pkg": { "resolved": "x.y.z" } } } }

export function parseNuGet(content: string, filename: string): Component[] {
  const seen = new Set<string>()
  const results: Component[] = []

  function add(name: string, version: string) {
    const v = version.replace(/^v/, '')
    if (!name || !v.match(/^\d+\.\d+/)) return
    const key = `${name}@${v}`
    if (seen.has(key)) return
    seen.add(key)
    results.push({ ecosystem: 'NuGet', name, version: v })
  }

  const lower = filename.toLowerCase()

  // packages.lock.json
  if (lower === 'packages.lock.json') {
    try {
      const parsed = JSON.parse(content) as {
        dependencies?: Record<string, Record<string, { resolved?: string }>>
      }
      for (const tfmDeps of Object.values(parsed.dependencies ?? {})) {
        for (const [name, info] of Object.entries(tfmDeps)) {
          add(name, info.resolved ?? '')
        }
      }
    } catch { /* not valid JSON */ }
    return results
  }

  // packages.config: <package id="Newtonsoft.Json" version="13.0.1" />
  if (lower === 'packages.config') {
    const pkgPattern = /<package[^>]+id="([^"]+)"[^>]+version="([^"]+)"/g
    for (const m of content.matchAll(pkgPattern)) add(m[1], m[2])
    return results
  }

  // *.csproj / *.fsproj / *.vbproj / Directory.Packages.props
  // <PackageReference Include="Newtonsoft.Json" Version="13.0.1" />
  const refPattern = /<PackageReference[^>]+Include="([^"]+)"[^>]+Version="([^"]+)"/gi
  for (const m of content.matchAll(refPattern)) add(m[1], m[2])
  // Version on child element: <PackageReference Include="x"><Version>y</Version></PackageReference>
  const refAltPattern = /<PackageReference[^>]+Include="([^"]+)"[^>]*>[\s\S]*?<Version>([^<]+)<\/Version>/gi
  for (const m of content.matchAll(refAltPattern)) add(m[1], m[2])

  return results
}
