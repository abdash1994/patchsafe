'use client'

interface Props { severity: number; label: string }

const style: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30',
  Medium:   'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30',
  Low:      'bg-green-500/15 text-green-400 ring-1 ring-green-500/30',
  Unknown:  'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30',
}

export function SeverityBadge({ severity, label }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${style[label] ?? style.Unknown}`}>
      {label}
      {severity > 0 && <span className="opacity-60 font-normal">{severity.toFixed(1)}</span>}
    </span>
  )
}
