# VulnScanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a stateless Next.js web app where users upload a dependency manifest and get back a sorted vulnerability table with fix versions.

**Architecture:** Client-side manifest parsing → POST to Next.js API route → fan-out to OSV/deps.dev/KEV/EPSS → return enriched VulnResult[] → render sortable table.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Vercel

**Spec:** `docs/superpowers/specs/2026-10-18-vuln-scanner-design.md`

## Global Constraints

- Next.js 14 App Router only — no Pages Router
- TypeScript strict mode throughout
- No database, no auth, fully stateless
- All external APIs are free, no keys required
- Vercel free tier: API route timeout max 30s, set in vercel.json
- File content never leaves the browser — only parsed component list sent to API
- `abdash1994/vuln-scanner` GitHub repo

## Review Focus

- OSV returns multiple vulnerabilities per component; each must become its own result row
- EPSS API accepts comma-separated CVE IDs (batch) — don't call once per CVE
- KEV JSON is ~1MB; fetch once per API route invocation, not once per CVE
- `requirements.txt` lines can be `pkg==1.0`, `pkg>=1.0`, `pkg~=1.0` — only `==` gives an exact version; others should skip gracefully
- `yarn.lock` is a custom format, not JSON — parser must handle `^` prefix on version strings

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `vercel.json`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `lib/types.ts`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Produces: `Component` and `VulnResult` types in `lib/types.ts` used by all subsequent tasks

- [ ] **Step 1: Initialise Next.js project**

```bash
cd ~/Desktop
npx create-next-app@latest vuln-scanner \
  --typescript --tailwind --app --no-src-dir \
  --no-eslint --import-alias "@/*"
cd vuln-scanner
```

- [ ] **Step 2: Verify it starts**

```bash
npm run dev &
sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200
kill %1
```

- [ ] **Step 3: Write `lib/types.ts`**

```ts
export interface Component {
  ecosystem: 'npm' | 'Maven' | 'PyPI' | 'Go' | 'crates.io'
  name: string      // "log4j-core" or "org.apache.log4j:log4j-core"
  version: string   // exact semver string
}

export interface VulnResult {
  name: string
  version: string
  cveId: string
  severity: number
  severityLabel: 'Critical' | 'High' | 'Medium' | 'Low' | 'Unknown'
  description: string
  fixVersion: string   // empty string if none found
  kev: boolean
  epss: number         // 0–1
}
```

- [ ] **Step 4: Create `vercel.json`**

```json
{
  "functions": {
    "app/api/scan/route.ts": {
      "maxDuration": 30
    }
  }
}
```

- [ ] **Step 5: Create minimal `app/layout.tsx`**

Title: `VulnScanner — Dependency Vulnerability Checker`. Dark background `bg-gray-950`, white text.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with types"
```

---

### Task 2: Manifest parsers

**Files:**
- Create: `lib/parsers/maven.ts`
- Create: `lib/parsers/npm.ts`
- Create: `lib/parsers/python.ts`
- Create: `lib/parsers/golang.ts`
- Create: `lib/parsers/rust.ts`
- Create: `lib/parsers/index.ts`

**Interfaces:**
- Consumes: `Component` from `lib/types.ts`
- Produces: `parseManifest(filename: string, content: string): Component[]` exported from `lib/parsers/index.ts`

- [ ] **Step 1: Write failing test for Maven parser**

```ts
// lib/parsers/maven.test.ts
import { parseMaven } from './maven'
const POM = `<project>
  <dependencies>
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-core</artifactId>
      <version>2.14.1</version>
    </dependency>
  </dependencies>
</project>`

test('parseMaven extracts groupId:artifactId version', () => {
  const result = parseMaven(POM)
  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    ecosystem: 'Maven',
    name: 'org.apache.logging.log4j:log4j-core',
    version: '2.14.1'
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest lib/parsers/maven.test.ts 2>&1 | tail -5
```

- [ ] **Step 3: Implement `lib/parsers/maven.ts`**

`parseMaven(content: string): Component[]` — use regex to match `<groupId>`, `<artifactId>`, `<version>` within each `<dependency>` block. Skip entries where version contains `$` (property references). Name format: `groupId:artifactId`.

- [ ] **Step 4: Write and run tests for npm, python, golang, rust parsers**

npm test: `package.json` with `"dependencies": {"lodash": "4.17.20"}` → `[{ecosystem:'npm', name:'lodash', version:'4.17.20'}]`. Strip `^`, `~`, `>=` prefixes from version; if result is not a valid semver-like string, skip.

python test: `requirements.txt` line `requests==2.28.0` → `[{ecosystem:'PyPI', name:'requests', version:'2.28.0'}]`. Only parse `==` pinned lines; skip `>=`, `~=`, `>`, lines without a version operator.

golang test: `go.mod` line `require github.com/gin-gonic/gin v1.9.0` → `[{ecosystem:'Go', name:'github.com/gin-gonic/gin', version:'1.9.0'}]`. Strip leading `v` from version.

rust test: `Cargo.toml` `[dependencies]` section `serde = "1.0.160"` → `[{ecosystem:'crates.io', name:'serde', version:'1.0.160'}]`.

- [ ] **Step 5: Implement all four parsers** following the same pattern as Maven.

- [ ] **Step 6: Implement `lib/parsers/index.ts`**

```ts
export function parseManifest(filename: string, content: string): Component[]
```

Route by filename: `pom.xml` → parseMaven, `package.json` → parseNpm, `requirements.txt` / `Pipfile.lock` → parsePython, `go.mod` → parseGolang, `Cargo.toml` → parseRust. Return `[]` for unknown filenames.

- [ ] **Step 7: Run all parser tests**

```bash
npx jest lib/parsers/ --passWithNoTests
# Expected: all PASS
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: manifest parsers for Maven/npm/Python/Go/Rust"
```

---

### Task 3: OSV client

**Files:**
- Create: `lib/osv.ts`

**Interfaces:**
- Consumes: `Component` from `lib/types.ts`
- Produces: `queryOSV(components: Component[]): Promise<OsvHit[]>` where `OsvHit = { component: Component, cveId: string, severity: number, description: string }`

- [ ] **Step 1: Write test (mocked fetch)**

```ts
// lib/osv.test.ts
import { queryOSV } from './osv'

// mock fetch globally
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    results: [{
      vulns: [{
        id: 'GHSA-abc',
        aliases: ['CVE-2021-44228'],
        severity: [{ type: 'CVSS_V3', score: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H' }],
        summary: 'Remote code execution in Log4j'
      }]
    }]
  })
})

test('queryOSV maps vulns to OsvHit[]', async () => {
  const hits = await queryOSV([{ ecosystem: 'Maven', name: 'org.apache.logging.log4j:log4j-core', version: '2.14.1' }])
  expect(hits[0].cveId).toBe('CVE-2021-44228')
  expect(hits[0].severity).toBeGreaterThan(9)
  expect(hits[0].description).toContain('Log4j')
})
```

- [ ] **Step 2: Run test to confirm it fails**

- [ ] **Step 3: Implement `lib/osv.ts`**

`queryOSV(components: Component[]): Promise<OsvHit[]>`

POST `https://api.osv.dev/v1/querybatch` with body `{ queries: components.map(c => ({ package: { name: c.name, ecosystem: c.ecosystem }, version: c.version })) }`.

For each result entry, for each vuln: extract `id`, prefer `CVE-*` from `aliases[]` else use `id`. Parse CVSS base score from `severity[].score` string using regex on the last segment `(CVSS:.*/(\d+\.\d+)$)` — if unparseable, score = 0. Use `summary` as description, truncated to 200 chars.

- [ ] **Step 4: Run test to confirm it passes**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: OSV API client"
```

---

### Task 4: KEV and EPSS clients

**Files:**
- Create: `lib/kev.ts`
- Create: `lib/epss.ts`

**Interfaces:**
- Produces: `isKev(cveId: string, kevSet: Set<string>): boolean` and `fetchKevSet(): Promise<Set<string>>` from `lib/kev.ts`
- Produces: `fetchEpss(cveIds: string[]): Promise<Map<string, number>>` from `lib/epss.ts`

- [ ] **Step 1: Write tests**

kev test: `fetchKevSet` returns a `Set<string>` containing `'CVE-2021-44228'` when the mock JSON has that entry in `vulnerabilities[].cveID`.

epss test: `fetchEpss(['CVE-2021-44228'])` returns `Map { 'CVE-2021-44228' => 0.97561 }` from mocked `api.first.org` response.

- [ ] **Step 2: Implement `lib/kev.ts`**

`fetchKevSet(): Promise<Set<string>>` — fetch `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`, return `new Set(data.vulnerabilities.map(v => v.cveID))`. On fetch error, return empty Set (never crash the scan).

`isKev(cveId, kevSet)` — return `kevSet.has(cveId)`.

- [ ] **Step 3: Implement `lib/epss.ts`**

`fetchEpss(cveIds: string[]): Promise<Map<string, number>>` — GET `https://api.first.org/data/1.0/epss?cve=CVE1,CVE2,...` (comma-joined, max 100 per call; split into batches if needed). Map each returned `{cve, epss}` entry. On error, return empty Map.

- [ ] **Step 4: Run tests, confirm pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: CISA KEV and FIRST EPSS clients"
```

---

### Task 5: deps.dev fix-version client

**Files:**
- Create: `lib/deps-dev.ts`

**Interfaces:**
- Produces: `fetchFixVersion(component: Component, cveId: string): Promise<string>` — returns earliest version not affected by the given CVE, or `''`

- [ ] **Step 1: Write test**

Mock `api.deps.dev` returning a version list; the test expects the first version after `2.14.1` that is NOT in the OSV affected ranges to be returned.

In practice this is complex — for MVP, simplify: call OSV's `affected[].ranges` for the vuln, find the `introduced`/`fixed` pair, return the `fixed` version string directly from OSV data rather than querying deps.dev per component.

Revise interface: `extractFixVersion(osvVuln: OsvVuln): string` — reads `affected[0].ranges[].events` for `{fixed: "x.y.z"}` and returns the first fix version found, else `''`.

- [ ] **Step 2: Implement `lib/deps-dev.ts`**

```ts
export function extractFixVersion(osvVuln: OsvVuln): string
```

Walk `osvVuln.affected[].ranges[].events[]`, return the value of the first `{fixed: string}` entry found. Return `''` if none.

- [ ] **Step 3: Run test, confirm pass**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: fix version extraction from OSV affected ranges"
```

---

### Task 6: Enricher — fan-out orchestrator

**Files:**
- Create: `lib/enricher.ts`

**Interfaces:**
- Consumes: `Component[]`, `queryOSV`, `fetchKevSet`, `fetchEpss`, `extractFixVersion`
- Produces: `enrich(components: Component[]): Promise<VulnResult[]>`

- [ ] **Step 1: Write integration test with all clients mocked**

```ts
// lib/enricher.test.ts
// Mock osv, kev, epss modules
// Input: one Maven component with a known CVE
// Expected output: one VulnResult with severity, kev:true, epss:0.97, fixVersion:'2.17.1'
```

- [ ] **Step 2: Implement `lib/enricher.ts`**

```
enrich(components):
  1. const kevSet = await fetchKevSet()
  2. const osvHits = await queryOSV(components)  // already fan-out batched
  3. const allCveIds = unique CVE IDs from osvHits
  4. const epssMap = await fetchEpss(allCveIds)
  5. for each osvHit: build VulnResult {
       name, version from hit.component,
       cveId, severity, description from hit,
       severityLabel: severity>=9?'Critical':>=7?'High':>=4?'Medium':'Low',
       fixVersion: extractFixVersion(hit.rawVuln),
       kev: isKev(cveId, kevSet),
       epss: epssMap.get(cveId) ?? 0
     }
  6. sort by severity descending
  7. return results
```

- [ ] **Step 3: Run test, confirm pass**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: enricher fan-out orchestrator"
```

---

### Task 7: API route

**Files:**
- Create: `app/api/scan/route.ts`

**Interfaces:**
- Consumes: `enrich` from `lib/enricher.ts`, `Component` from `lib/types.ts`
- Produces: `POST /api/scan` accepts `{ components: Component[] }`, returns `{ results: VulnResult[] }`

- [ ] **Step 1: Implement `app/api/scan/route.ts`**

```ts
export async function POST(req: Request) {
  const { components } = await req.json()
  if (!Array.isArray(components) || components.length === 0) {
    return Response.json({ error: 'No components provided' }, { status: 400 })
  }
  if (components.length > 500) {
    return Response.json({ error: 'Too many components (max 500)' }, { status: 400 })
  }
  const results = await enrich(components)
  return Response.json({ results })
}
```

- [ ] **Step 2: Smoke test with curl**

```bash
npm run build 2>&1 | tail -10
npm run dev &
sleep 5
curl -s -X POST http://localhost:3000/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"components":[{"ecosystem":"npm","name":"lodash","version":"4.17.4"}]}' \
  | jq '.results | length'
kill %1
# Expected: number >= 0, no crash
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: POST /api/scan route"
```

---

### Task 8: Frontend — upload + results

**Files:**
- Create: `components/FileUpload.tsx`
- Create: `components/SeverityBadge.tsx`
- Create: `components/SummaryBar.tsx`
- Create: `components/ResultsTable.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `VulnResult`, `Component` from `lib/types.ts`; `parseManifest` from `lib/parsers/index.ts`

- [ ] **Step 1: Implement `components/SeverityBadge.tsx`**

Props: `severity: number`. Render a pill: Critical=red, High=orange, Medium=yellow, Low=green. Show label + score.

- [ ] **Step 2: Implement `components/SummaryBar.tsx`**

Props: `results: VulnResult[]`. Show counts: `X Critical · Y High · Z Medium · W Low`. Each count colored with its severity color.

- [ ] **Step 3: Implement `components/FileUpload.tsx`**

Props: `onParsed: (components: Component[]) => void`. Renders a dashed drop zone. Accepts drag-drop or click-to-browse. Reads file as text, calls `parseManifest(file.name, content)`, calls `onParsed`. Shows filename after load. Also show a "paste content" textarea toggle as fallback — user types the filename and pastes.

- [ ] **Step 4: Implement `components/ResultsTable.tsx`**

Props: `results: VulnResult[]`. Columns: Component, Version, CVE, Severity, Description, Fix Version, KEV, EPSS. Sortable by clicking column headers (client-side sort). KEV column: red "⚠ Exploited" badge or dash. EPSS: shown as percentage. Fix Version: green if present, dash if not. Filter input at top to search by component name or CVE ID.

- [ ] **Step 5: Implement `app/page.tsx`**

State: `components`, `results`, `loading`, `error`.

Flow:
1. Show `<FileUpload>` with headline "Scan your dependencies for vulnerabilities"
2. On `onParsed`: show component count, enable "Scan" button
3. On Scan click: POST to `/api/scan`, set loading
4. On response: render `<SummaryBar>` + `<ResultsTable>`
5. On error: show red error message

Style: dark theme (`bg-gray-950 text-white`), centered max-w-5xl, Tailwind throughout.

- [ ] **Step 6: Manual smoke test**

```bash
npm run dev
# Open localhost:3000, upload a pom.xml, click Scan
# Verify table renders with at least one row if vulnerable component present
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: file upload UI and results table"
```

---

### Task 9: README, GitHub repo, Vercel deploy

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write README.md**

Include: what it is, supported file types, how to run locally (`npm install && npm run dev`), how it works (data sources: OSV, EPSS, KEV), privacy note (files never leave the browser), Vercel deploy badge once live.

- [ ] **Step 2: Create GitHub repo and push**

```bash
cd ~/Desktop/vuln-scanner
git remote add origin https://github.com/abdash1994/vuln-scanner.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Deploy to Vercel**

```bash
npx vercel --yes --prod 2>&1 | tail -10
# Expected: deployment URL printed
```

- [ ] **Step 4: Final smoke test on live URL**

Open the Vercel URL, upload `test-pom.xml` with log4j 2.14.1, verify CVE-2021-44228 appears in results with fix version and KEV flag.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: README with deploy instructions"
git push
```
