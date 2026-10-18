'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'vuln-scanner-star-dismissed'

export function StarPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
      } catch {
        setVisible(true)
      }
    }, 1800)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* */ }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 fade-up">
      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px var(--glass-border)' }}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-500">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="star-prompt-text text-xs font-semibold leading-tight">Found this useful?</p>
          <a href="https://github.com/abdash1994/patchsafe" target="_blank" rel="noopener noreferrer"
            onClick={dismiss}
            className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors">
            Star the repo on GitHub ↗
          </a>
        </div>
        <button onClick={dismiss} aria-label="Dismiss"
          className="star-dismiss ml-1 flex-shrink-0 transition-colors">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
