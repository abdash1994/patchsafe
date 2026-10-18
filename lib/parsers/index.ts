import type { Component } from '../types'
import { parseMaven } from './maven'
import { parseNpm } from './npm'
import { parsePython } from './python'
import { parseGolang } from './golang'
import { parseRust } from './rust'

export function parseManifest(filename: string, content: string): Component[] {
  const name = filename.toLowerCase()
  if (name === 'pom.xml' || name.endsWith('.xml')) return parseMaven(content)
  if (name === 'package.json') return parseNpm(content)
  if (name === 'requirements.txt' || name === 'pipfile.lock') return parsePython(content)
  if (name === 'go.mod') return parseGolang(content)
  if (name === 'cargo.toml') return parseRust(content)
  return []
}

export const SUPPORTED_FILES = ['pom.xml', 'package.json', 'requirements.txt', 'Pipfile.lock', 'go.mod', 'Cargo.toml']
