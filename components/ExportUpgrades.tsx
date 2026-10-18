'use client'

import { useState } from 'react'
import type { VulnResult } from '@/lib/types'

interface Props { results: VulnResult[] }

type Ecosystem = VulnResult['ecosystem']

function buildCommands(results: VulnResult[]): string {
  // Deduplicate: one fix version per (ecosystem, name) pair — take highest fix version
  const best = new Map<string, { ecosystem: Ecosystem; name: string; fixVersion: string }>()
  for (const r of results) {
    if (!r.fixVersion) continue
    const key = `${r.ecosystem}::${r.name}`
    const existing = best.get(key)
    if (!existing) {
      best.set(key, { ecosystem: r.ecosystem, name: r.name, fixVersion: r.fixVersion })
    }
    // keep whichever fix version string sorts higher (simple semver approximation)
    else if (r.fixVersion > existing.fixVersion) {
      existing.fixVersion = r.fixVersion
    }
  }

  const byEco = new Map<Ecosystem, Array<{ name: string; fixVersion: string }>>()
  for (const v of best.values()) {
    const arr = byEco.get(v.ecosystem) ?? []
    arr.push({ name: v.name, fixVersion: v.fixVersion })
    byEco.set(v.ecosystem, arr)
  }

  const lines: string[] = []

  for (const [eco, pkgs] of byEco) {
    lines.push(`# ── ${eco} ──`)

    if (eco === 'npm') {
      const specs = pkgs.map(p => `${p.name}@${p.fixVersion}`).join(' ')
      lines.push(`npm install ${specs}`)
    } else if (eco === 'PyPI') {
      const specs = pkgs.map(p => `${p.name}==${p.fixVersion}`).join(' ')
      lines.push(`pip install ${specs}`)
    } else if (eco === 'Maven') {
      lines.push('# Add or update in pom.xml:')
      for (const p of pkgs) {
        const [groupId, artifactId] = p.name.split(':')
        lines.push(`#   <groupId>${groupId ?? p.name}</groupId>`)
        lines.push(`#   <artifactId>${artifactId ?? ''}</artifactId>`)
        lines.push(`#   <version>${p.fixVersion}</version>`)
      }
    } else if (eco === 'Go') {
      for (const p of pkgs) {
        lines.push(`go get ${p.name}@v${p.fixVersion}`)
      }
    } else if (eco === 'crates.io') {
      lines.push('# Update Cargo.toml:')
      for (const p of pkgs) {
        lines.push(`cargo add ${p.name}@${p.fixVersion}`)
      }
    } else if (eco === 'RubyGems') {
      for (const p of pkgs) {
        lines.push(`gem install ${p.name} -v ${p.fixVersion}`)
      }
    } else if (eco === 'Packagist') {
      const specs = pkgs.map(p => `${p.name}:${p.fixVersion}`).join(' ')
      lines.push(`composer require ${specs}`)
    } else if (eco === 'NuGet') {
      for (const p of pkgs) {
        lines.push(`dotnet add package ${p.name} --version ${p.fixVersion}`)
      }
    } else if (eco === 'Pub') {
      for (const p of pkgs) {
        lines.push(`flutter pub add ${p.name}:${p.fixVersion}`)
      }
    } else {
      for (const p of pkgs) {
        lines.push(`# ${p.name} → ${p.fixVersion}`)
      }
    }

    lines.push('')
  }

  return lines.join('\n').trim()
}

export function ExportUpgrades({ results }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const withFix = results.filter(r => r.fixVersion)
  if (withFix.length === 0) return null

  const commands = buildCommands(withFix)
  const uniqueCount = new Set(withFix.map(r => `${r.ecosystem}::${r.name}`)).size

  async function copy() {
    await navigator.clipboard.writeText(commands)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Upgrade commands</p>
            <p className="text-xs text-slate-500">
              {uniqueCount} package{uniqueCount !== 1 ? 's' : ''} with available fixes — ready to paste into your terminal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={e => { e.stopPropagation(); copy() }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30 hover:bg-indigo-500/30'
            }`}
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy all
              </>
            )}
          </button>
          <span className={`text-slate-500 transition-transform text-xs ${open ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {/* Expandable code block */}
      {open && (
        <div className="border-t border-white/6 fade-up">
          <pre className="overflow-x-auto px-5 py-4 text-xs leading-relaxed text-slate-300 font-mono whitespace-pre">
            {commands}
          </pre>
        </div>
      )}
    </div>
  )
}
