# VulnScanner

> **If this tool is useful to you, please [⭐ star the repo](https://github.com/abdash1994/vuln-scanner) before cloning — it takes one click and helps other developers find it. Thank you.**

**Free, open-source, stateless dependency vulnerability scanner.**

Drop any manifest file — npm, Maven, PyPI, Go, Rust, Ruby, .NET, PHP — and get back a full vulnerability report with CVSS scores, fix versions, CISA KEV flags, EPSS exploit probability, and one-click upgrade commands. No login. No API keys. No data stored.

🔗 **Live app:** https://vuln-scanner-phi.vercel.app

---

## Built by

**Aditya Ikram Dash**
Product Manager · AI Builder · Security Enthusiast

- GitHub: [@abdash1994](https://github.com/abdash1994)
- LinkedIn: [adityaikramdash](https://www.linkedin.com/in/adityaikramdash)
- Email: abdash1994@gmail.com

If this tool helped you, consider [starring the repo ⭐](https://github.com/abdash1994/vuln-scanner) — it helps others find it.

---

## How it works

1. **Parse locally** — your manifest is read entirely in the browser. File contents never leave your machine.
2. **Query OSV** — component list is sent to Google's [OSV.dev](https://osv.dev) batch API for vulnerability matching.
3. **Enrich with KEV + EPSS** — each CVE is cross-referenced against [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) and [FIRST EPSS](https://www.first.org/epss), both fetched live per scan.
4. **Prioritise** — results sorted by CVSS severity, then KEV exploitability.

All three data sources are public, free, and authoritative. No proprietary data. No Sonatype. No vendor lock-in.

## Data sources

| Source | Owner | What it provides | Update cadence |
|--------|-------|------------------|----------------|
| [OSV.dev](https://osv.dev) | Google Open Source Security | CVE severity, CVSS scores, fix versions | Continuous |
| [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | US Cybersecurity & Infrastructure Security Agency | Confirmed active exploitation | Weekly |
| [FIRST EPSS](https://www.first.org/epss) | Forum of Incident Response & Security Teams | 30-day exploit probability (ML model) | Daily |

## Supported manifest formats

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

## Running locally

```bash
git clone https://github.com/abdash1994/vuln-scanner.git
cd vuln-scanner
npm install
npm run dev
```

Open http://localhost:3000

## Tech stack

- [Next.js 16](https://nextjs.org) — App Router, API routes
- [Tailwind CSS 4](https://tailwindcss.com) — styling
- [OSV.dev API](https://google.github.io/osv.dev/api/) — vulnerability data
- [CISA KEV JSON feed](https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json) — exploitability
- [FIRST EPSS API](https://www.first.org/epss/api) — exploit probability
- Deployed on [Vercel](https://vercel.com)

## Privacy

Your manifest file is parsed entirely in the browser using JavaScript. The server only receives a flat list of package names and versions — never file contents, never source code, never paths. There is no database, no account, and nothing stored between sessions.

## License

MIT License — Copyright (c) 2026 Aditya Ikram Dash

See [LICENSE](./LICENSE) for full text. You are free to use, copy, modify, and distribute this software. The copyright notice and this permission notice must be included in all copies or substantial portions of the software.
