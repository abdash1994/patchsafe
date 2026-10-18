'use client'

import { useCallback, useState } from 'react'
import { parseManifest, SUPPORTED_FILES } from '@/lib/parsers'
import type { Component } from '@/lib/types'

interface Props {
  onParsed: (components: Component[], filename: string) => void
}

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
        setError(`No components found in "${file.name}". Supported formats: ${SUPPORTED_FILES.join(', ')}`)
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

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  return (
    <div className="w-full">
      <label
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
          dragging ? 'border-blue-400 bg-blue-950' : 'border-gray-700 bg-gray-900 hover:border-gray-500'
        }`}
      >
        <input type="file" className="sr-only" onChange={onInputChange} />
        <div className="mb-3 text-4xl">📄</div>
        <p className="mb-1 text-lg font-semibold text-gray-200">
          {loaded ?? 'Drop your manifest file here'}
        </p>
        <p className="text-sm text-gray-500">
          {loaded ? 'Drop another file to rescan' : `Supports: ${SUPPORTED_FILES.join(', ')}`}
        </p>
      </label>
      {error && (
        <p className="mt-2 rounded bg-red-950 px-3 py-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
