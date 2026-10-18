'use client'
import { useState } from 'react'
import type { VulnResult } from '@/lib/types'

interface Props { results: VulnResult[] }
type Ecosystem = VulnResult['ecosystem']

function buildCommands(results: VulnResult[]): string {
  const best = new Map<string, { ecosystem: Ecosystem; name: string; fixVersion: string }>()
  for (const r of results) {
    if (!r.fixVersion) continue
    const key = `${r.ecosystem}::${r.name}`
    const existing = best.get(key)
    if (!existing) best.set(key, { ecosystem: r.ecosystem, name: r.name, fixVersion: r.fixVersion })
    else if (r.fixVersion > existing.fixVersion) existing.fixVersion = r.fixVersion
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
    if (eco === 'npm') lines.push(`npm install ${pkgs.map(p => `${p.name}@${p.fixVersion}`).join(' ')}`)
    else if (eco === 'PyPI') lines.push(`pip install ${pkgs.map(p => `${p.name}==${p.fixVersion}`).join(' ')}`)
    else if (eco === 'Maven') { lines.push('# Update pom.xml:'); for (const p of pkgs) { const [g, a] = p.name.split(':'); lines.push(`#   ${g ?? p.name}:${a ?? ''}:${p.fixVersion}`) } }
    else if (eco === 'Go') for (const p of pkgs) lines.push(`go get ${p.name}@v${p.fixVersion}`)
    else if (eco === 'crates.io') for (const p of pkgs) lines.push(`cargo add ${p.name}@${p.fixVersion}`)
    else if (eco === 'RubyGems') for (const p of pkgs) lines.push(`gem install ${p.name} -v ${p.fixVersion}`)
    else if (eco === 'Packagist') lines.push(`composer require ${pkgs.map(p => `${p.name}:${p.fixVersion}`).join(' ')}`)
    else if (eco === 'NuGet') for (const p of pkgs) lines.push(`dotnet add package ${p.name} --version ${p.fixVersion}`)
    else if (eco === 'Pub') for (const p of pkgs) lines.push(`flutter pub add ${p.name}:${p.fixVersion}`)
    else for (const p of pkgs) lines.push(`# ${p.name} → ${p.fixVersion}`)
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
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors text-left"
        style={{ background: 'transparent' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold t-1">Upgrade commands</p>
            <p className="text-xs t-m">{uniqueCount} package{uniqueCount !== 1 ? 's' : ''} with fixes — ready to paste into your terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={e => { e.stopPropagation(); copy() }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ring-1 ${
              copied
                ? 'bg-emerald-500/15 text-emerald-600 ring-emerald-500/25'
                : 'bg-indigo-500/15 text-indigo-500 ring-indigo-500/25 hover:bg-indigo-500/25'
            }`}>
            {copied ? (
              <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Copied</>
            ) : (
              <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Copy all</>
            )}
          </button>
          <span className={`t-m text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>
      {open && (
        <div className="div-h fade-up">
          <pre className="overflow-x-auto px-5 py-4 text-xs leading-relaxed font-mono whitespace-pre t-2"
            style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {commands}
          </pre>
        </div>
      )}
    </div>
  )
}
