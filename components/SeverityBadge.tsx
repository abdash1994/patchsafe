'use client'

interface Props {
  severity: number
  label: string
}

const colorMap: Record<string, string> = {
  Critical: 'bg-red-600 text-white',
  High: 'bg-orange-500 text-white',
  Medium: 'bg-yellow-400 text-gray-900',
  Low: 'bg-green-500 text-white',
  Unknown: 'bg-gray-600 text-gray-200',
}

export function SeverityBadge({ severity, label }: Props) {
  const cls = colorMap[label] ?? colorMap.Unknown
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
      {severity > 0 && <span className="opacity-80">({severity.toFixed(1)})</span>}
    </span>
  )
}
