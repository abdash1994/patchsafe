'use client'
interface Props { severity: number; label: string }

const style: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-500 ring-1 ring-red-500/25',
  High:     'bg-orange-500/15 text-orange-500 ring-1 ring-orange-500/25',
  Medium:   'bg-yellow-500/15 text-yellow-600 ring-1 ring-yellow-500/25',
  Low:      'bg-green-500/15 text-green-600 ring-1 ring-green-500/25',
  Unknown:  'bg-slate-500/15 text-slate-500 ring-1 ring-slate-500/25',
}

export function SeverityBadge({ severity, label }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${style[label] ?? style.Unknown}`}>
      {label}
      {severity > 0 && <span className="opacity-55 font-normal tabular-nums">{severity.toFixed(1)}</span>}
    </span>
  )
}
