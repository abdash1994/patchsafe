'use client'

import { useCallback, useState } from 'react'
import { parseManifest, SUPPORTED_FILES } from '@/lib/parsers'
import type { Component } from '@/lib/types'

interface Props {
  onParsed: (components: Component[], filename: string) => void
}

const ECOSYSTEMS = [
  { icon: '📦', label: 'npm / yarn', files: 'package.json · package-lock.json · yarn.lock' },
  { icon: '☕', label: 'Maven / Gradle', files: 'pom.xml · build.gradle' },
  { icon: '🐍', label: 'Python', files: 'requirements.txt · poetry.lock · pyproject.toml' },
  { icon: '🦀', label: 'Rust / Go / Ruby', files: 'Cargo.toml · go.mod · Gemfile.lock' },
  { icon: '🔷', label: '.NET / PHP', files: '*.csproj · packages.config · composer.lock' },
]

export function FileUpload({ onParsed }: Props) {
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
      setLoaded(`${file.name} — ${components.length} components detected`)
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

  return (
    <div className="w-full space-y-4">
      <label
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-14 transition-all duration-200 ${
          dragging ? 'drop-active' : 'border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/3'
        }`}
      >
        <input type="file" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />

        {/* Upload icon */}
        <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${dragging ? 'bg-indigo-500/20 scale-110' : 'bg-white/5 group-hover:bg-white/8'}`}>
          <svg className={`h-8 w-8 transition-colors ${dragging ? 'text-indigo-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V8m0 0-3 3m3-3 3 3M6 20h12a2 2 0 002-2V8l-5-5H6a2 2 0 00-2 2v13a2 2 0 002 2z" />
          </svg>
        </div>

        {loaded ? (
          <div className="text-center">
            <p className="text-base font-semibold text-emerald-400">{loaded}</p>
            <p className="mt-1 text-sm text-slate-500">Drop another file to rescan</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-200">Drop your manifest file here</p>
            <p className="mt-1 text-sm text-slate-500">or click to browse — parsed entirely in your browser</p>
          </div>
        )}

        {/* Ecosystem chips */}
        {!loaded && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {ECOSYSTEMS.map(eco => (
              <span key={eco.label} className="glass rounded-full px-3 py-1 text-xs text-slate-400">
                {eco.icon} {eco.label}
              </span>
            ))}
          </div>
        )}
      </label>

      {error && (
        <div className="glass rounded-xl px-4 py-3 text-sm text-red-400 border-red-500/20">
          {error}
        </div>
      )}
    </div>
  )
}
