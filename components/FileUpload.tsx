'use client'
import { useCallback, useState } from 'react'
import { parseManifest, SUPPORTED_FILES } from '@/lib/parsers'
import type { Component } from '@/lib/types'

interface Props {
  onParsed: (components: Component[], filename: string) => void
  scanning?: boolean
}

const ECOSYSTEMS = [
  { icon: '📦', label: 'npm / yarn' },
  { icon: '☕', label: 'Maven / Gradle' },
  { icon: '🐍', label: 'Python' },
  { icon: '🦀', label: 'Rust' },
  { icon: '🐹', label: 'Go' },
  { icon: '💎', label: 'Ruby' },
  { icon: '🔷', label: '.NET' },
  { icon: '🐘', label: 'PHP' },
]

export function FileUpload({ onParsed, scanning }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loaded, setLoaded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback((file: File) => {
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const components = parseManifest(file.name, content)
      if (components.length === 0) {
        setError(`No components found in "${file.name}". Supported: ${SUPPORTED_FILES.join(', ')}`)
        setLoaded(null)
        return
      }
      setLoaded(`${file.name} — ${components.length} components`)
      onParsed(components, file.name)
    }
    reader.readAsText(file)
  }, [onParsed])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const zoneClass = scanning
    ? 'drop-scanning cursor-default'
    : dragging
    ? 'drop-active cursor-copy'
    : 'drop-idle cursor-pointer'

  return (
    <div className="w-full space-y-3">
      <label
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={`group relative flex flex-col items-center justify-center rounded-2xl p-14 transition-all duration-200 ${zoneClass}`}
      >
        <input type="file" className="sr-only" disabled={scanning}
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />

        {scanning ? (
          <div className="flex flex-col items-center gap-4">
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <p className="text-sm font-semibold t-2">Scanning…</p>
          </div>
        ) : loaded ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-emerald-500">{loaded}</p>
            <p className="text-xs t-m">Drop another file to rescan</p>
          </div>
        ) : (
          <>
            <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${dragging ? 'bg-indigo-500/20 scale-110' : 'icon-well'}`}>
              <svg className={`h-8 w-8 transition-colors ${dragging ? 'text-indigo-400' : 't-m'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 16V8m0 0-3 3m3-3 3 3M6 20h12a2 2 0 002-2V8l-5-5H6a2 2 0 00-2 2v13a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg font-semibold t-1">Drop your manifest file here</p>
            <p className="mt-1 text-sm t-m">or click to browse · scans automatically on drop</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {ECOSYSTEMS.map(eco => (
                <span key={eco.label} className="eco-chip">{eco.icon} {eco.label}</span>
              ))}
            </div>
          </>
        )}
      </label>

      {error && (
        <div className="glass rounded-xl px-4 py-3 text-sm text-red-500">{error}</div>
      )}
    </div>
  )
}
