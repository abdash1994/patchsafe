# VulnScanner — Design Document

## Intent and Why

Developers and security teams need to know quickly which components in their project are vulnerable, why, and what version to upgrade to. Existing tools either require accounts, cost money, have complex setup, or return noisy results without actionable fix guidance.

VulnScanner is a free, open, stateless web app: paste or upload a manifest file, get back a clear table of vulnerable components sorted by severity, with the CVE reason and the exact fix version. No login, no API keys, no data retention.

## Goals

- Accept `pom.xml`, `package.json`, `requirements.txt`, `go.mod`, `yarn.lock`, `Pipfile.lock`, `Cargo.toml`
- Parse direct and (where deterministic) transitive dependencies from the manifest
- For every component, query free public APIs for vulnerability data
- Return: component name, current version, CVE ID, severity (CVSS), why it's vulnerable (description), fix version, whether it's actively exploited (KEV), exploit probability (EPSS)
- Sortable/filterable results table
- Deployable to Vercel from a GitHub repo with zero config

## Non-Goals

- GitHub URL scanning (v2)
- Terminal CLI (v2)
- User accounts / saved history
- Container image scanning
- Paid or rate-limited data sources

## Anti-Goals (failure conditions)

- Requiring an API key from the user
- Storing or logging any uploaded file content
- Returning results that name a "fix version" that doesn't actually fix the CVE

## Constraints

- Next.js 14 (App Router)
- Tailwind CSS
- TypeScript throughout
- No database, no auth, fully stateless
- All data from public free APIs: OSV.dev, deps.dev, CISA KEV JSON, FIRST.org EPSS
- Vercel free tier compatible (no long-running processes, API routes only)
- Single GitHub repo: `abdash1994/vuln-scanner`

## Data Sources

| Source | What it provides | API |
|--------|-----------------|-----|
| OSV.dev | CVE/GHSA list per package+version, description, affected ranges | `api.osv.dev/v1/query` POST |
| deps.dev | Earliest non-vulnerable version (fix version) | `api.deps.dev/v3/Version/{system}/{name}/{version}` |
| CISA KEV | Is this CVE in the Known Exploited Vulnerabilities catalog | Static JSON: `cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` |
| FIRST EPSS | Probability of exploitation in next 30 days (0–1) | `api.first.org/data/1.0/epss?cve=CVE-xxx` |

## Architecture

```
User browser
  → uploads manifest file
  → Next.js frontend (React) parses file client-side into component list
  → POST /api/scan  { components: [{ecosystem, name, version}] }
  → API route fans out to OSV, deps.dev, KEV, EPSS
  → returns enriched vulnerability list
  → frontend renders sortable results table
```

Parsing happens client-side (no file uploaded to server — privacy). Only the structured component list is sent to the API route.

## Result Row Shape

```ts
interface VulnResult {
  name: string          // "org.apache.log4j:log4j-core"
  version: string       // "2.14.1"
  cveId: string         // "CVE-2021-44228"
  severity: number      // CVSS score 0-10
  severityLabel: string // "Critical" | "High" | "Medium" | "Low"
  description: string   // short summary from OSV
  fixVersion: string    // "2.17.1"
  kev: boolean          // true = actively exploited
  epss: number          // 0.97 = 97% exploit probability
}
```

## File Structure

```
vuln-scanner/
  app/
    page.tsx              # upload UI + results table
    api/
      scan/route.ts       # POST handler, orchestrates API calls
  lib/
    parsers/
      maven.ts            # pom.xml → {ecosystem, name, version}[]
      npm.ts              # package.json / yarn.lock → components[]
      python.ts           # requirements.txt / Pipfile.lock → components[]
      golang.ts           # go.mod → components[]
      rust.ts             # Cargo.toml → components[]
    osv.ts                # OSV API client
    deps-dev.ts           # deps.dev API client
    kev.ts                # CISA KEV fetcher + cache
    epss.ts               # FIRST EPSS API client
    enricher.ts           # fan-out: takes components[], returns VulnResult[]
    types.ts              # shared TypeScript interfaces
  components/
    FileUpload.tsx         # drag-drop + paste upload zone
    ResultsTable.tsx       # sortable vulnerability results table
    SeverityBadge.tsx      # colored severity pill
    SummaryBar.tsx         # "X critical, Y high..." count bar
  public/
    (static assets)
  package.json
  tailwind.config.ts
  tsconfig.json
  next.config.ts
  vercel.json             # function timeout: 30s for API route
  README.md
```
