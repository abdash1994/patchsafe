# VulnScanner

A free, stateless web app that scans dependency manifests for known vulnerabilities and tells you exactly which version to upgrade to.

Upload a manifest file. Get back every CVE, severity score, whether it's actively exploited, and the fix version — no login, no API keys, no data stored.

## Supported file formats

| File | Ecosystem |
|------|-----------|
| `pom.xml` | Maven (Java) |
| `package.json` | npm (Node.js) |
| `requirements.txt` | PyPI (Python) |
| `go.mod` | Go |
| `Cargo.toml` | Rust (crates.io) |

## How it works

1. You drop a manifest file — it's parsed **in your browser** and never sent to the server
2. Only the structured component list (name + version) is POSTed to `/api/scan`
3. The API route fans out to three free public data sources in parallel:
   - **[OSV.dev](https://osv.dev)** — vulnerability database covering CVEs and GHSAs across all ecosystems
   - **[CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)** — Known Exploited Vulnerabilities catalog (is this actively exploited?)
   - **[FIRST EPSS](https://www.first.org/epss)** — probability this CVE will be exploited in the next 30 days
4. Fix versions come from OSV's `affected[].ranges[].events[].fixed` — the same version that OSV marks as no longer affected

## Results

The table shows, for each vulnerability:

- Component name and current version
- CVE ID (links to NVD)
- CVSS severity score and label (Critical / High / Medium / Low)
- Short description from OSV
- **Fix version** — the exact version to upgrade to (green if available)
- **KEV flag** — red badge if this CVE is in CISA's actively-exploited list
- **EPSS %** — probability of exploitation in the next 30 days

Sortable by severity, component name, CVE ID, or EPSS score. Filterable by name or CVE.

## Privacy

Your manifest file content never leaves your browser. Only a list of package names and versions is sent to the server. Nothing is logged or stored.

## Running locally

```bash
git clone https://github.com/abdash1994/vuln-scanner
cd vuln-scanner
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

```bash
npx vercel --prod
```

The `vercel.json` sets a 30-second timeout on the scan API route to allow time for the fan-out to external APIs.

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Vercel** (deployment)
- Zero dependencies beyond Next.js itself — all API calls use native `fetch`
