import type { Component } from '../types'
import { parseMaven } from './maven'
import { parseNpm } from './npm'
import { parsePackageLock } from './package-lock'
import { parseYarnLock } from './yarn'
import { parsePython } from './python'
import { parsePoetryLock, parsePyproject } from './poetry'
import { parseGolang } from './golang'
import { parseRust } from './rust'
import { parseGradle } from './gradle'
import { parseGemfileLock } from './gemfile'
import { parseComposerLock } from './composer'
import { parseNuGet } from './nuget'

// Exact-match routing table: filename → parser
const EXACT: Record<string, (content: string, filename: string) => Component[]> = {
  'pom.xml':             (c) => parseMaven(c),
  'package.json':        (c) => parseNpm(c),
  'package-lock.json':   (c) => parsePackageLock(c),
  'yarn.lock':           (c) => parseYarnLock(c),
  'requirements.txt':    (c) => parsePython(c),
  'pipfile.lock':        (c) => parsePython(c),         // Pipfile.lock has same pinned format
  'poetry.lock':         (c) => parsePoetryLock(c),
  'pyproject.toml':      (c) => parsePyproject(c),
  'go.mod':              (c) => parseGolang(c),
  'go.sum':              (c) => parseGolang(c),         // go.sum has same module lines
  'cargo.toml':          (c) => parseRust(c),
  'cargo.lock':          (c) => parseRust(c),           // Cargo.lock is also TOML
  'gemfile.lock':        (c) => parseGemfileLock(c),
  'composer.lock':       (c) => parseComposerLock(c),
  'packages.config':     (c, f) => parseNuGet(c, f),
  'packages.lock.json':  (c, f) => parseNuGet(c, f),
}

// Extension/suffix routing for project files
function routeBySuffix(name: string, content: string, filename: string): Component[] | null {
  if (name.endsWith('.xml') && (content.includes('<dependencies>') || content.includes('<dependency>')))
    return parseMaven(content)
  if (name.endsWith('.gradle') || name.endsWith('.gradle.kts'))
    return parseGradle(content)
  if (name.endsWith('.csproj') || name.endsWith('.fsproj') || name.endsWith('.vbproj'))
    return parseNuGet(content, filename)
  if (name === 'directory.packages.props' || name === 'directory.build.props')
    return parseNuGet(content, filename)
  if (name.endsWith('.toml') && content.includes('[[package]]'))
    return parsePoetryLock(content)
  if (name.endsWith('.toml') && (content.includes('[dependencies]') || content.includes('[dev-dependencies]')))
    return parseRust(content)
  return null
}

// Similarity matching: score a filename against known patterns using character overlap.
// Returns the best-guess parser name, or null if confidence is too low.
function similarityMatch(name: string): ((content: string, filename: string) => Component[]) | null {
  // Known base names to fuzzy-match against
  const candidates = Object.keys(EXACT)
  let bestScore = 0
  let bestKey = ''
  for (const candidate of candidates) {
    const score = jaccardSimilarity(name, candidate)
    if (score > bestScore) { bestScore = score; bestKey = candidate }
  }
  // Require at least 0.5 similarity to avoid false positives
  if (bestScore >= 0.5 && bestKey) return EXACT[bestKey]
  return null
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(''))
  const setB = new Set(b.split(''))
  const intersection = [...setA].filter(c => setB.has(c)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

export function parseManifest(filename: string, content: string): Component[] {
  const name = filename.toLowerCase()

  // 1. Exact match
  if (EXACT[name]) return EXACT[name](content, filename)

  // 2. Suffix/pattern match
  const bySuffix = routeBySuffix(name, content, filename)
  if (bySuffix) return bySuffix

  // 3. Similarity fallback
  const similar = similarityMatch(name)
  if (similar) return similar(content, filename)

  return []
}

export const SUPPORTED_FILES = [
  // JavaScript / Node
  'package.json', 'package-lock.json', 'yarn.lock',
  // Python
  'requirements.txt', 'poetry.lock', 'Pipfile.lock', 'pyproject.toml',
  // Java / JVM
  'pom.xml', 'build.gradle', 'build.gradle.kts',
  // Go
  'go.mod',
  // Rust
  'Cargo.toml', 'Cargo.lock',
  // Ruby
  'Gemfile.lock',
  // PHP
  'composer.lock',
  // .NET
  '*.csproj', 'packages.config', 'packages.lock.json',
]
