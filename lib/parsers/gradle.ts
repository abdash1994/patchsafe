import type { Component } from '../types'

// Parses build.gradle (Groovy DSL) and build.gradle.kts (Kotlin DSL).
// Handles common dependency declaration styles:
//   implementation 'group:artifact:1.2.3'
//   implementation("group:artifact:1.2.3")
//   implementation group: 'group', name: 'artifact', version: '1.2.3'

export function parseGradle(content: string): Component[] {
  const seen = new Set<string>()
  const results: Component[] = []

  function add(groupId: string, artifactId: string, version: string) {
    if (!groupId || !artifactId || !version) return
    if (!version.match(/^\d+\.\d+/)) return
    const name = `${groupId}:${artifactId}`
    const key = `${name}@${version}`
    if (seen.has(key)) return
    seen.add(key)
    results.push({ ecosystem: 'Maven', name, version })
  }

  // String notation: 'group:artifact:version' or "group:artifact:version"
  const stringPattern = /(?:implementation|api|compile|testImplementation|runtimeOnly|compileOnly|annotationProcessor|kapt)\s*[("']+([^"'()]+):([^"'():]+):([^"'():]+)[)"']+/g
  for (const m of content.matchAll(stringPattern)) {
    add(m[1].trim(), m[2].trim(), m[3].trim())
  }

  // Map notation: group: 'x', name: 'y', version: 'z'
  const mapPattern = /group:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*version:\s*['"]([^'"]+)['"]/g
  for (const m of content.matchAll(mapPattern)) {
    add(m[1].trim(), m[2].trim(), m[3].trim())
  }

  return results
}
