import type { Component } from '../types'

export function parseGolang(content: string): Component[] {
  const results: Component[] = []
  let inRequireBlock = false

  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (line === 'require (') { inRequireBlock = true; continue }
    if (inRequireBlock && line === ')') { inRequireBlock = false; continue }

    // Inline require: "require module/path v1.2.3"
    const inlineMatch = line.match(/^require\s+(\S+)\s+v(\S+)/)
    if (inlineMatch) {
      results.push({ ecosystem: 'Go', name: inlineMatch[1], version: inlineMatch[2] })
      continue
    }

    // Inside require block: "module/path v1.2.3"
    if (inRequireBlock) {
      const blockMatch = line.match(/^(\S+)\s+v(\S+)/)
      if (blockMatch && !line.startsWith('//')) {
        results.push({ ecosystem: 'Go', name: blockMatch[1], version: blockMatch[2] })
      }
    }
  }
  return results
}
