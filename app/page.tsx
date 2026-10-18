'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/FileUpload'
import { ResultsTable } from '@/components/ResultsTable'
import { SummaryBar } from '@/components/SummaryBar'
import { ExportUpgrades } from '@/components/ExportUpgrades'
import { StarPrompt } from '@/components/StarPrompt'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Component, VulnResult } from '@/lib/types'

type State = 'idle' | 'scanning' | 'done' | 'error'

const SOURCES = [
  {
    id: 'osv',
    accent: 'text-blue-500',
    ring: 'ring-blue-500/20',
    dot: 'bg-blue-500',
    glow: 'osv-glow',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    name: 'OSV.dev',
    owner: 'Google Open Source Security',
    tagline: 'CVE severity · CVSS scores · fix versions',
    detail: "The Open Source Vulnerability database indexes every published CVE, GHSA, and ecosystem advisory for npm, Maven, PyPI, Go, Rust, and more. Updated continuously by maintainers and Google's security team. Every CVSS score and fix version comes directly from OSV.",
    link: 'https://osv.dev',
    stat: '40,000+ advisories',
    cadence: 'Continuous',
  },
  {
    id: 'kev',
    accent: 'text-red-500',
    ring: 'ring-red-500/20',
    dot: 'bg-red-500',
    glow: 'kev-glow',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    name: 'CISA KEV',
    owner: 'US Cybersecurity & Infrastructure Security Agency',
    tagline: 'Active exploitation confirmed in the wild',
    detail: "CISA's Known Exploited Vulnerabilities catalog lists CVEs confirmed exploited in real attacks. A KEV flag means threat actors are actively using this vulnerability today. Federal agencies are mandated to patch KEV entries within 14 days.",
    link: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    stat: '1,700+ confirmed exploited',
    cadence: 'Weekly',
  },
  {
    id: 'epss',
    accent: 'text-violet-500',
    ring: 'ring-violet-500/20',
    dot: 'bg-violet-500',
    glow: 'epss-glow',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    name: 'FIRST EPSS',
    owner: 'Forum of Incident Response & Security Teams',
    tagline: '30-day exploit probability score',
    detail: "EPSS uses a machine-learning model trained on real-world exploit data to estimate the probability a CVE will be exploited in the next 30 days. Far more actionable than CVSS alone for prioritising what to patch first.",
    link: 'https://www.first.org/epss',
    stat: 'ML model, daily refresh',
    cadence: 'Daily',
  },
]

export default function Home() {
  const [state, setState] = useState<State>('idle')
  const [filename, setFilename] = useState('')
  const [results, setResults] = useState<VulnResult[]>([])
  const [error, setError] = useState('')
  const [expandedSource, setExpandedSource] = useState<string | null>(null)

  async function onParsed(components: Component[], name: string) {
    setFilename(name)
    setResults([])
    setError('')
    setState('scanning')
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scan failed')
      setResults(data.results)
      setState('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
      setState('error')
    }
  }

  return (
    <>
      <div className="orb orb-blue" />
      <div className="orb orb-violet" />

      {/* ── Top nav ── */}
      <nav className="relative z-20 mx-auto max-w-5xl px-4 sm:px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20">
            <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span className="text-sm font-semibold t-1">PatchSafe</span>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://github.com/abdash1994/patchsafe" target="_blank" rel="noopener noreferrer"
            className="theme-toggle flex h-8 w-8 items-center justify-center rounded-xl transition-all"
            title="Star on GitHub">
            <svg className="h-4 w-4 t-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-20">

        {/* ── Hero ── */}
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs t-m mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live data · No login · No storage
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-text leading-tight">
            Know what&apos;s vulnerable.<br />Fix it today.
          </h1>
          <p className="text-lg t-2 max-w-2xl mx-auto">
            Drop any dependency manifest. Get a full vulnerability report with CVSS scores, fix versions, active-exploit flags, and terminal upgrade commands. Free, open-source, stateless.
          </p>
          <p className="text-xs t-d">
            Powered by OSV.dev · CISA KEV · FIRST EPSS — all public, all free, all live
          </p>
        </section>

        {/* ── Upload + scan ── */}
        <section className="space-y-4">
          <FileUpload onParsed={onParsed} scanning={state === 'scanning'} />

          {state === 'scanning' && (
            <div className="flex items-center gap-3 t-m fade-up">
              <div className="spinner" />
              <span className="text-sm">
                Scanning <span className="font-mono t-2">{filename}</span> — querying OSV · CISA KEV · FIRST EPSS…
              </span>
            </div>
          )}

          {state === 'error' && (
            <div className="glass rounded-xl px-4 py-3 text-sm text-red-500 fade-up">{error}</div>
          )}
        </section>

        {/* ── Star prompt ── */}
        {state === 'done' && results.length > 0 && <StarPrompt />}

        {/* ── Results ── */}
        {state === 'done' && (
          <section className="space-y-4 fade-up">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-sm font-semibold t-m">
                Results for <span className="font-mono t-1">{filename}</span>
              </h2>
              <button onClick={() => setState('idle')}
                className="text-xs t-d hover:t-m underline underline-offset-2 transition-colors">
                Scan another file
              </button>
            </div>

            {results.length === 0 ? (
              <div className="glass rounded-2xl px-6 py-12 text-center space-y-2">
                <div className="text-3xl">✓</div>
                <p className="text-base font-semibold text-emerald-500">No known vulnerabilities found</p>
                <p className="text-sm t-m">All components are clean against OSV, CISA KEV, and FIRST EPSS as of today.</p>
              </div>
            ) : (
              <>
                <SummaryBar results={results} />
                <ExportUpgrades results={results} />
                <ResultsTable results={results} />
              </>
            )}
          </section>
        )}

        {/* ── Data sources ── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold t-1">Where the data comes from</h2>
            <p className="text-sm t-m max-w-xl mx-auto">
              Every number traces back to one of three authoritative public sources. Click a card to understand what it contributes and why you can trust it.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {SOURCES.map(s => {
              const open = expandedSource === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setExpandedSource(open ? null : s.id)}
                  className={`${s.glow} glass glass-hover rounded-2xl p-5 text-left transition-all duration-200 ${open ? `ring-1 ${s.ring}` : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.accent} flex-shrink-0`}
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}>{s.icon}</div>
                    <div className={`text-xs mt-1 transition-transform ${open ? 'rotate-180' : ''} ${s.accent}`}>▾</div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} flex-shrink-0`} />
                      <span className={`text-sm font-bold ${s.accent}`}>{s.name}</span>
                    </div>
                    <p className="text-xs t-m">{s.owner}</p>
                    <p className={`text-xs font-medium t-2`}>{s.tagline}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs t-d">{s.stat}</span>
                    <span className="text-xs t-d">↻ {s.cadence}</span>
                  </div>
                  {open && (
                    <div className="mt-4 div-h pt-4 text-xs t-2 leading-relaxed text-left fade-up">
                      <p>{s.detail}</p>
                      <a href={s.link} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className={`mt-3 inline-flex items-center gap-1 ${s.accent} hover:underline`}>
                        Visit {s.name} ↗
                      </a>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Trust ── */}
        <section className="glass rounded-2xl p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold t-1">Why trust the scores?</h2>
            <p className="text-sm t-m">Security data is only useful if you know its provenance.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { t: 'CVSS scores come from NVD/OSV, not us', b: 'Severity scores are computed by NVD analysts and published in CVE records. OSV surfaces them verbatim. No adjustments. The score you see is the same score your enterprise scanner would show.' },
              { t: 'KEV is US federal government data', b: "CISA's KEV list is mandatory for all US federal civilian agencies. A KEV flag is not a prediction — it means CISA has confirmed active exploitation in the wild." },
              { t: 'EPSS is peer-reviewed ML, not guesswork', b: "FIRST's EPSS model is published in academic papers, updated daily, and trained on observed exploit data. A high score means the model has seen patterns that reliably precede exploitation." },
              { t: 'Data is live on every scan', b: 'Nothing is cached. Every scan hits OSV, KEV, and EPSS fresh. A CVE disclosed yesterday will appear today with its current EPSS score and KEV status.' },
            ].map(item => (
              <div key={item.t} className="flex gap-4">
                <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <svg className="h-3 w-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold t-1">{item.t}</p>
                  <p className="mt-1 text-xs t-m leading-relaxed">{item.b}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Privacy ── */}
        <section className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold t-1">Your source code never leaves your machine</p>
            <p className="mt-1 text-xs t-m leading-relaxed">
              Manifest files are parsed entirely in your browser. The server only receives a flat list of package names and versions — never file contents, never source code, never paths. No database. No account. Nothing stored between sessions.
            </p>
          </div>
        </section>

        {/* ── Author card ── */}
        <section className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex-shrink-0">
            <img src="/aditya.png" alt="Aditya Ikram Dash"
              className="h-20 w-20 rounded-2xl object-cover object-top"
              style={{ boxShadow: '0 0 0 2px var(--glass-border)' }} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-base font-bold t-1">Aditya Ikram Dash</p>
            <p className="text-xs t-m mt-0.5">Product Manager · AI Builder · Security Enthusiast</p>
            <p className="text-xs t-2 mt-3 leading-relaxed max-w-lg">
              Built this to give every developer — from solo indie hackers to enterprise AppSec teams — instant, free, no-login access to the same vulnerability intelligence commercial tools charge for. Powered entirely by public data.
            </p>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
              <a href="https://github.com/abdash1994/patchsafe" target="_blank" rel="noopener noreferrer"
                className="link-chip">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Star on GitHub
              </a>
              <a href="https://www.linkedin.com/in/adityaikramdash" target="_blank" rel="noopener noreferrer"
                className="link-chip">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
              <a href="mailto:abdash1994@gmail.com" className="link-chip">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                abdash1994@gmail.com
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="text-center text-xs t-d space-y-1 pb-4">
          <p>Open source · No telemetry · No login required</p>
          <p>
            Data:{' '}
            <a href="https://osv.dev" target="_blank" rel="noopener noreferrer" className="footer-link">OSV.dev</a>
            {' · '}
            <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noopener noreferrer" className="footer-link">CISA KEV</a>
            {' · '}
            <a href="https://www.first.org/epss" target="_blank" rel="noopener noreferrer" className="footer-link">FIRST EPSS</a>
          </p>
        </footer>

      </div>
    </>
  )
}
