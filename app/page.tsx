'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/FileUpload'
import { ResultsTable } from '@/components/ResultsTable'
import { SummaryBar } from '@/components/SummaryBar'
import type { Component, VulnResult } from '@/lib/types'

type State = 'idle' | 'ready' | 'scanning' | 'done' | 'error'

/* ── Static data ──────────────────────────────────────────────────── */

const SOURCES = [
  {
    id: 'osv',
    glow: 'osv-glow',
    accent: 'text-blue-400',
    ring: 'ring-blue-500/20',
    dot: 'bg-blue-400',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    name: 'OSV.dev',
    owner: 'Google Open Source Security',
    tagline: 'CVE severity · CVSS scores · fix versions',
    detail: "The Open Source Vulnerability database indexes every published CVE, GHSA, and ecosystem advisory for npm, Maven, PyPI, Go, Rust, and more. Updated continuously by maintainers and Google's security team. Every CVSS score and fix version in the results table comes directly from OSV.",
    link: 'https://osv.dev',
    stat: '40,000+ advisories',
    updateCadence: 'Continuous',
  },
  {
    id: 'kev',
    glow: 'kev-glow',
    accent: 'text-red-400',
    ring: 'ring-red-500/20',
    dot: 'bg-red-400',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    name: 'CISA KEV',
    owner: 'US Cybersecurity & Infrastructure Security Agency',
    tagline: 'Active exploitation in the wild',
    detail: "CISA's Known Exploited Vulnerabilities catalog is a curated list of CVEs that have been confirmed exploited in real attacks — not just theoretically dangerous. A KEV flag means threat actors are actively using this vulnerability today. CISA mandates federal agencies patch KEV entries within 14 days.",
    link: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    stat: '1,700+ confirmed exploited',
    updateCadence: 'Weekly',
  },
  {
    id: 'epss',
    glow: 'epss-glow',
    accent: 'text-violet-400',
    ring: 'ring-violet-500/20',
    dot: 'bg-violet-400',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    name: 'FIRST EPSS',
    owner: 'Forum of Incident Response & Security Teams',
    tagline: '30-day exploit probability score',
    detail: "The Exploit Prediction Scoring System uses a machine-learning model trained on real-world exploit data to estimate the probability that a CVE will be exploited in the next 30 days. A score of 20% means roughly 1-in-5 chance of active exploitation this month — dramatically more actionable than CVSS alone for prioritising what to fix first.",
    link: 'https://www.first.org/epss',
    stat: 'ML model, daily refresh',
    updateCadence: 'Daily',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Parse locally',
    body: 'Your manifest is read entirely in the browser. No file bytes are ever uploaded — the server only receives a list of package names and versions.',
  },
  {
    n: '02',
    title: 'Query OSV',
    body: 'The component list is sent to OSV\'s public batch API. We fetch full vulnerability records for every match, deduplicating transitive deps first.',
  },
  {
    n: '03',
    title: 'Enrich with KEV + EPSS',
    body: 'Each CVE is cross-referenced against the CISA KEV feed and FIRST\'s EPSS API — both fetched fresh on every scan, never cached.',
  },
  {
    n: '04',
    title: 'Prioritise',
    body: 'Results are sorted by CVSS severity, then KEV exploitability, so the most dangerous vulnerabilities surface at the top.',
  },
]

/* ── Component ────────────────────────────────────────────────────── */

export default function Home() {
  const [state, setState] = useState<State>('idle')
  const [components, setComponents] = useState<Component[]>([])
  const [filename, setFilename] = useState('')
  const [results, setResults] = useState<VulnResult[]>([])
  const [error, setError] = useState('')
  const [expandedSource, setExpandedSource] = useState<string | null>(null)

  function onParsed(parsed: Component[], name: string) {
    setComponents(parsed)
    setFilename(name)
    setResults([])
    setError('')
    setState('ready')
  }

  async function scan() {
    setState('scanning')
    setError('')
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
      {/* Background orbs */}
      <div className="orb orb-blue" />
      <div className="orb orb-violet" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-16 space-y-20">

        {/* ── Hero ── */}
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-slate-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Live data · No login · No storage
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-text leading-tight">
            Know what's<br />vulnerable. Fix it today.
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Upload any dependency manifest — npm, Maven, PyPI, Go, Rust, Ruby, .NET — and get a full vulnerability report with CVE IDs, CVSS scores, fix versions, and real-world exploit probability. Free, open-source, and stateless.
          </p>
          <p className="text-xs text-slate-600">
            Powered by OSV.dev · CISA KEV · FIRST EPSS — all public, all free, all live
          </p>
        </section>

        {/* ── Upload ── */}
        <section>
          <FileUpload onParsed={onParsed} />

          {state === 'ready' && (
            <div className="mt-5 flex flex-wrap items-center gap-4 fade-up">
              <p className="text-sm text-slate-400">
                <span className="font-semibold text-white">{components.length}</span> components in{' '}
                <span className="font-mono text-slate-300">{filename}</span>
              </p>
              <button onClick={scan} className="btn-scan rounded-xl px-6 py-2.5 text-sm font-semibold text-white">
                Scan for vulnerabilities →
              </button>
            </div>
          )}

          {state === 'scanning' && (
            <div className="mt-5 flex items-center gap-3 text-slate-400 fade-up">
              <div className="spinner" />
              <span className="text-sm">Querying OSV · CISA KEV · FIRST EPSS…</span>
            </div>
          )}

          {state === 'error' && (
            <div className="mt-4 glass rounded-xl px-4 py-3 text-sm text-red-400 border-red-500/20 fade-up">
              {error}
            </div>
          )}
        </section>

        {/* ── Results ── */}
        {state === 'done' && (
          <section className="space-y-4 fade-up">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-base font-semibold text-slate-300">
                Results for <span className="font-mono text-white">{filename}</span>
              </h2>
              <button onClick={() => setState('ready')} className="text-xs text-slate-600 hover:text-slate-400 underline underline-offset-2 transition-colors">
                Scan another file
              </button>
            </div>

            {results.length === 0 ? (
              <div className="glass rounded-2xl px-6 py-12 text-center space-y-2">
                <div className="text-3xl">✓</div>
                <p className="text-base font-semibold text-emerald-400">No known vulnerabilities found</p>
                <p className="text-sm text-slate-500">All scanned components are clean against OSV, CISA KEV, and FIRST EPSS as of today.</p>
              </div>
            ) : (
              <>
                <SummaryBar results={results} />
                <ResultsTable results={results} />
              </>
            )}
          </section>
        )}

        {/* ── Data sources ── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Where the data comes from</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Every number in the results table traces back to one of three authoritative public sources. Click any card to understand exactly what it contributes and why you can trust it.
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
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/6 ${s.accent} flex-shrink-0`}>
                      {s.icon}
                    </div>
                    <div className={`text-xs mt-1 transition-transform ${open ? 'rotate-180' : ''} ${s.accent}`}>▾</div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} flex-shrink-0`} />
                      <span className="text-sm font-bold text-white">{s.name}</span>
                    </div>
                    <p className="text-xs text-slate-500">{s.owner}</p>
                    <p className={`text-xs font-medium ${s.accent}`}>{s.tagline}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-600">{s.stat}</span>
                    <span className="text-xs text-slate-600">↻ {s.updateCadence}</span>
                  </div>

                  {open && (
                    <div className="mt-4 border-t border-white/8 pt-4 text-xs text-slate-400 leading-relaxed text-left fade-up">
                      <p>{s.detail}</p>
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className={`mt-3 inline-flex items-center gap-1 ${s.accent} hover:underline`}
                      >
                        Visit {s.name} ↗
                      </a>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">How it works</h2>
            <p className="text-sm text-slate-500">Four steps, entirely transparent, nothing hidden.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <div key={step.n} className="glass rounded-2xl p-5 space-y-3 relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 right-0 translate-x-1/2 z-10 text-slate-700 text-xs">→</div>
                )}
                <span className="text-3xl font-bold text-white/10">{step.n}</span>
                <h3 className="text-sm font-semibold text-slate-200">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust & accuracy ── */}
        <section className="glass rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Why trust the scores?</h2>
            <p className="text-sm text-slate-500">Security data is only as useful as its provenance. Here's ours.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'CVSS scores come from NVD/OSV, not us',
                body: 'Severity scores are computed by NVD analysts and published in CVE records. OSV surfaces them verbatim. We apply no adjustments. The score you see is the same score your security tool would show.',
              },
              {
                title: 'KEV is US federal government data',
                body: 'CISA\'s Known Exploited Vulnerabilities list is a mandatory reference for all US federal civilian agencies. A KEV flag is not a prediction — it means CISA has confirmed active exploitation in the wild.',
              },
              {
                title: 'EPSS is peer-reviewed ML, not guesswork',
                body: 'FIRST\'s EPSS model is published in academic papers, updated daily, and trained on observed exploit data from real incident reports. A high EPSS score means the model has seen patterns that precede exploitation.',
              },
              {
                title: 'Data is live on every scan',
                body: 'Nothing is cached. Every scan hits the OSV, KEV, and EPSS APIs fresh. A vulnerability disclosed yesterday will appear in your results today — including its latest EPSS score and KEV status.',
              },
            ].map(item => (
              <div key={item.title} className="flex gap-4">
                <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <svg className="h-3 w-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Privacy callout ── */}
        <section className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Your source code never leaves your machine</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Manifest files are parsed entirely in your browser using JavaScript. The server only receives a flat list of package names and versions — never file contents, never source code, never paths. There is no database. No account. Nothing stored between sessions.
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="text-center text-xs text-slate-700 space-y-1 pb-4">
          <p>Open source · No telemetry · No login required</p>
          <p>
            Data sources:{' '}
            <a href="https://osv.dev" target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 transition-colors">OSV.dev</a>
            {' · '}
            <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 transition-colors">CISA KEV</a>
            {' · '}
            <a href="https://www.first.org/epss" target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 transition-colors">FIRST EPSS</a>
          </p>
        </footer>

      </div>
    </>
  )
}
