'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/FileUpload'
import { ResultsTable } from '@/components/ResultsTable'
import { SummaryBar } from '@/components/SummaryBar'
import type { Component, VulnResult } from '@/lib/types'

type State = 'idle' | 'ready' | 'scanning' | 'done' | 'error'

export default function Home() {
  const [state, setState] = useState<State>('idle')
  const [components, setComponents] = useState<Component[]>([])
  const [filename, setFilename] = useState('')
  const [results, setResults] = useState<VulnResult[]>([])
  const [error, setError] = useState('')

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
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-4xl font-bold text-white">VulnScanner</h1>
        <p className="text-gray-400">
          Upload a dependency manifest. Get back every vulnerability, the CVE, and the exact version to upgrade to.
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Files never leave your browser. Powered by OSV, CISA KEV, and FIRST EPSS.
        </p>
      </div>

      <FileUpload onParsed={onParsed} />

      {state === 'ready' && (
        <div className="mt-4 flex items-center gap-4">
          <p className="text-sm text-gray-400">
            Found <span className="font-semibold text-white">{components.length}</span> components in{' '}
            <span className="font-mono text-gray-300">{filename}</span>
          </p>
          <button
            onClick={scan}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:scale-95 transition-transform"
          >
            Scan for vulnerabilities
          </button>
        </div>
      )}

      {state === 'scanning' && (
        <div className="mt-6 flex items-center gap-3 text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          Querying OSV, CISA KEV, and FIRST EPSS...
        </div>
      )}

      {(state === 'error') && (
        <div className="mt-4 rounded-lg bg-red-950 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {state === 'done' && (
        <div className="mt-6 space-y-4">
          {results.length === 0 ? (
            <div className="rounded-lg bg-green-950 px-4 py-6 text-center text-green-400">
              No known vulnerabilities found in the scanned components.
            </div>
          ) : (
            <>
              <SummaryBar results={results} />
              <ResultsTable results={results} />
            </>
          )}
          <button
            onClick={() => setState('ready')}
            className="text-xs text-gray-600 hover:text-gray-400 underline"
          >
            Scan again
          </button>
        </div>
      )}
    </main>
  )
}
