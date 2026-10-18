import type { Component } from '../types'

export function parseMaven(content: string): Component[] {
  const results: Component[] = []
  // Match each <dependency> block
  const depBlocks = content.match(/<dependency[\s\S]*?<\/dependency>/g) ?? []
  for (const block of depBlocks) {
    const groupId = block.match(/<groupId>\s*([^<]+)\s*<\/groupId>/)?.[1]?.trim()
    const artifactId = block.match(/<artifactId>\s*([^<]+)\s*<\/artifactId>/)?.[1]?.trim()
    const version = block.match(/<version>\s*([^<]+)\s*<\/version>/)?.[1]?.trim()
    // Skip property references and missing fields
    if (!groupId || !artifactId || !version || version.includes('$')) continue
    results.push({ ecosystem: 'Maven', name: `${groupId}:${artifactId}`, version })
  }
  return results
}
