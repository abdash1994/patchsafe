import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PatchSafe — Know What\'s Vulnerable. Fix It Today.',
  description: 'Drop any dependency manifest. PatchSafe instantly shows which packages are vulnerable, the CVE, CVSS score, exploit probability (EPSS), active exploit flags (CISA KEV), and the exact terminal command to fix it.',
}

// Injected before React hydrates — prevents flash of wrong theme
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('vs-theme');
    if (t === 'light') document.documentElement.setAttribute('data-theme','light');
  } catch(e){}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        {children}
      </body>
    </html>
  )
}
