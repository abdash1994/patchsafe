# VulnScanner

> A free, open-source dependency vulnerability scanner built on public data — no login, no API keys, no vendor lock-in.

**[Try it live](https://vuln-scanner-phi.vercel.app)** · [Star the repo ⭐](https://github.com/abdash1994/vuln-scanner) · Built by [Aditya Ikram Dash](https://www.linkedin.com/in/adityaikramdash)

---

## Why this exists

Every software team ships with third-party dependencies. Most have no idea which ones are vulnerable until something breaks in production or a security audit surfaces a six-month-old CVE.

The tools that solve this problem well — Snyk, Veracode, Black Duck, Sonatype — cost thousands of dollars a year. They require accounts, integrations, and ongoing contracts. A solo developer, a startup, or a team mid-sprint has none of that. So they skip the check entirely and ship blind.

**The insight:** all the vulnerability data those tools rely on is public. OSV.dev, CISA KEV, and FIRST EPSS are authoritative, continuously updated, and completely free. The commercial value isn't in the data — it's in the UX wrapped around it.

VulnScanner removes every barrier between a developer and that data:

- No account to create
- No API key to manage
- No integration to set up
- No file ever leaves the browser
- No cost, ever

Drop a file. Get results. Fix it.

---

## The problem it solves

### For individual developers
Open-source developers and indie hackers ship fast. Security tooling is an afterthought when you're building alone. VulnScanner fits into a workflow that has no budget and no DevSecOps team — it's as fast as opening a browser tab.

### For AppSec and security teams
A CISO evaluating a vendor, a security engineer doing a quick triage, or an AppSec team reviewing a contractor's repo — all of them need answers fast without spinning up a pipeline. This gives them that.

### For enterprises evaluating open-source tooling
Before committing to a paid SCA tool, teams can use VulnScanner to validate what commercial tools would find. It surfaces the same underlying data — OSV, KEV, EPSS — that enterprise scanners charge for, which makes it useful as a benchmark and a gut-check.

---

## What it does

Drop any dependency manifest. Get back:

| Column | What it tells you |
|--------|-------------------|
| **Component + Version** | Exactly which package and version is vulnerable |
| **Severity (CVSS)** | How bad it is — scored by NVD analysts, not guessed |
| **EPSS** | Probability the CVE will be exploited in the next 30 days |
| **KEV flag** | Whether CISA has confirmed active exploitation in the wild |
| **Fix version** | The exact version that patches it, linked to the official registry |
| **Upgrade commands** | One-click copy of `npm install`, `pip install`, `go get` etc. for all fixes |

Results are sorted by severity first, then KEV flag — so the most dangerous vulnerabilities surface at the top without any manual triage.

---

## Product decisions worth noting

A few non-obvious choices that shaped what this is and isn't:

**Client-side parsing.** Manifest files can contain internal package names, private registry URLs, and project structure that teams consider sensitive. Parsing in the browser means that information never touches a server. Trust is earned by architecture, not by a privacy policy.

**No scan button.** The original design had a two-step flow: upload, then click Scan. That's one unnecessary decision. Dropping a file is already a commitment — the scan triggers automatically. Removing that friction shaves the time-to-value from ~8 seconds to ~3.

**Expandable rows instead of 9 columns.** A results table with CVE, severity, description, EPSS, KEV, fix version, and ecosystem visible simultaneously is unreadable at a glance. The default view shows 4 columns. Click a row to expand CVE details inline. Scannable by default, detailed on demand.

**Bulk upgrade commands.** A developer looking at 16 vulnerabilities across 3 packages doesn't want to click 16 fix-version links. They want to paste one block of commands into their terminal. The export panel deduplicates packages, picks the highest fix version per package, and generates the right command syntax per ecosystem.

**Live data, no cache.** Every scan hits OSV, KEV, and EPSS fresh. A CVE disclosed yesterday shows up today with its current EPSS score. There's no stale database to maintain, no sync job to run, and no risk of showing outdated data. The architecture ages well without operational overhead.

---

## Data sources

All three are public, free, and maintained by organisations with strong institutional incentives to keep them accurate.

| Source | Owner | Provides | Updates |
|--------|-------|----------|---------|
| [OSV.dev](https://osv.dev) | Google Open Source Security | CVE severity, CVSS scores, fix versions | Continuous |
| [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | US Cybersecurity & Infrastructure Security Agency | Confirmed active exploitation in the wild | Weekly |
| [FIRST EPSS](https://www.first.org/epss) | Forum of Incident Response & Security Teams | 30-day exploit probability via ML model | Daily |

CVSS scores come from NVD analysts verbatim — no adjustments, no interpolation. KEV flags are not predictions; CISA mandates federal agencies patch KEV entries within 14 days. EPSS is peer-reviewed and published in academic literature.

---

## Supported formats

| Ecosystem | Files |
|-----------|-------|
| npm / Node | `package.json`, `package-lock.json`, `yarn.lock` |
| Python | `requirements.txt`, `poetry.lock`, `Pipfile.lock`, `pyproject.toml` |
| Java / JVM | `pom.xml`, `build.gradle`, `build.gradle.kts` |
| Go | `go.mod`, `go.sum` |
| Rust | `Cargo.toml`, `Cargo.lock` |
| Ruby | `Gemfile.lock` |
| PHP | `composer.lock` |
| .NET | `*.csproj`, `packages.config`, `packages.lock.json` |

Files with non-standard names are matched by content similarity — a file named `backend.pom.xml` or `deps.txt` will still route to the right parser.

---

## Running locally

```bash
git clone https://github.com/abdash1994/vuln-scanner.git
cd vuln-scanner
npm install
npm run dev
```

Open http://localhost:3000. No environment variables required.

---

## Tech stack

- [Next.js 16](https://nextjs.org) — App Router, server-side API fan-out
- [Tailwind CSS 4](https://tailwindcss.com) — styling
- [OSV.dev](https://google.github.io/osv.dev/api/), [CISA KEV](https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json), [FIRST EPSS](https://www.first.org/epss/api) — all data
- Deployed on [Vercel](https://vercel.com)

No proprietary data sources. No vendor SDKs. No paid APIs. The entire data layer can be replicated from public documentation.

---

## Privacy

Manifest files are parsed in the browser. The server receives only a list of package names and versions — no file contents, no source code, no paths. There is no database, no account system, and nothing persisted between sessions. The architecture is stateless by design.

---

## Built by

**Aditya Ikram Dash** — Product Manager with a background in software supply chain security and AI product development. This project grew out of firsthand experience working inside the SCA (Software Composition Analysis) space and watching teams go without basic vulnerability tooling simply because the access barrier was too high.

The goal was to prove that a well-scoped product, built on the right public infrastructure, could close that gap for free.

- LinkedIn: [adityaikramdash](https://www.linkedin.com/in/adityaikramdash)
- Email: abdash1994@gmail.com
- GitHub: [@abdash1994](https://github.com/abdash1994)

If VulnScanner was useful to you, a [star on GitHub](https://github.com/abdash1994/vuln-scanner) is the best way to help other developers find it.

---

## License

MIT — Copyright (c) 2026 Aditya Ikram Dash.

Free to use, fork, and build on. The copyright notice must be retained in all copies. See [LICENSE](./LICENSE).
