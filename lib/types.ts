export interface Component {
  ecosystem: 'npm' | 'Maven' | 'PyPI' | 'Go' | 'crates.io' | 'RubyGems' | 'Packagist' | 'NuGet' | 'Pub'
  name: string
  version: string
  isDirect?: boolean
}

export interface VulnResult {
  name: string
  version: string
  cveId: string
  severity: number
  severityLabel: 'Critical' | 'High' | 'Medium' | 'Low' | 'Unknown'
  description: string
  fixVersion: string
  kev: boolean
  epss: number
}

export interface OsvVuln {
  id: string
  aliases?: string[]
  summary?: string
  severity?: Array<{ type: string; score: string }>
  database_specific?: { severity?: string }
  affected?: Array<{
    ranges?: Array<{
      type: string
      events: Array<{ introduced?: string; fixed?: string }>
    }>
  }>
}

export interface OsvHit {
  component: Component
  cveId: string
  severity: number
  description: string
  rawVuln: OsvVuln
}
