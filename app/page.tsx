import Link from 'next/link'
import DrillAnimation from '@/components/DrillAnimation'

const SITES = [
  { name: 'Salton Sea',    tag: 'Highest temp',        risk: 'high'   },
  { name: 'Brawley Zone',  tag: 'Li+ power upside',    risk: 'high'   },
  { name: 'Calipatria N.', tag: 'Lowest capex',        risk: 'medium' },
  { name: 'East Mesa',     tag: 'Operator-friendly',   risk: 'medium' },
  { name: 'Heber Field',   tag: 'Best infrastructure', risk: 'low'    },
]

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 6v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    title: '3-minute assessment',
    desc: 'Answer questions about your rig fleet, depth, budget, and crew.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 19L8 10l4 6 3-4 4 7H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
    title: 'iPOD seismic model',
    desc: 'PGV from the Scripps Institution ROM — not static hazard maps.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="12" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="3" y="12" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M15.5 12v7M12 15.5h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    title: 'Go / No-Go verdict',
    desc: 'AI-powered memo + sensitivity sliders + PDF export.',
  },
]

const riskStyle: Record<string, string> = {
  high:   'bg-red-500/15 text-red-400 border-red-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  low:    'bg-green-500/15 text-green-400 border-green-500/20',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080d14] text-white">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-cyan-500 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5v11M1.5 7h11" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="7" cy="7" r="2.2" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">GeoPivot</span>
        </div>
        <Link
          href="/assess"
          className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors hidden sm:block"
        >
          Start assessment →
        </Link>
        <Link
          href="/analysis"
          className="text-sm text-slate-300 hover:text-white font-medium transition-colors hidden sm:block"
        >
          Data analytics
        </Link>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 items-center gap-0 px-6 pt-14 pb-10 sm:px-12 lg:px-16 max-w-6xl mx-auto w-full">

        {/* Left — text */}
        <div className="flex flex-col items-start animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-cyan-300 text-xs font-semibold mb-6 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Salton Sea · Imperial Valley, CA
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-5">
            Should your company<br />
            <span className="text-cyan-400">pivot to geothermal?</span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-md">
            Match your drilling capabilities to the Salton Sea's best sites.
            Get a data-backed <strong className="text-white">Go / No-Go</strong> in under 3 minutes.
          </p>

          <Link
            href="/assess"
            className="inline-flex items-center gap-2.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-all text-base shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:-translate-y-0.5"
          >
            Start Free Assessment
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <Link
            href="/analysis"
            className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 font-medium"
          >
            Explore data analytics →
          </Link>

          <p className="text-slate-600 text-xs mt-4">No account · PDF export · Sensitivity sliders</p>
        </div>

        {/* Right — animation */}
        <div className="animate-fade-up delay-200 flex justify-center lg:justify-end mt-10 lg:mt-0">
          <div className="relative w-full max-w-xs">
            {/* Glow backdrop */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-cyan-500/5 via-orange-500/5 to-red-500/10 blur-2xl" />
            <div className="relative rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm overflow-hidden p-2">
              {/* Header bar */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-white/25 font-mono">geothermal_cross_section.svg</span>
              </div>
              <DrillAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ── Sites strip ──────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-white/2 px-6 py-8 sm:px-12">
        <p className="text-xs text-slate-600 uppercase tracking-widest text-center mb-5 font-semibold">
          5 candidate zones evaluated
        </p>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {SITES.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-2.5 bg-white/3 border border-white/8 rounded-xl px-4 py-2.5 hover:bg-white/5 transition-colors"
            >
              <div>
                <div className="text-sm font-semibold text-white/90">{s.name}</div>
                <div className="text-xs text-slate-500">{s.tag}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${riskStyle[s.risk]}`}>
                {s.risk}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature strip ────────────────────────────────────── */}
      <section className="border-t border-white/5 px-6 py-10 sm:px-12">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                {f.icon}
              </div>
              <div>
                <div className="font-semibold text-white text-sm mb-1">{f.title}</div>
                <div className="text-slate-500 text-xs leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 text-center text-xs text-slate-700 py-5 px-6">
        GeoPivot · Seismic data: Scripps Institution of Oceanography iPOD ROM · For evaluation purposes only
      </footer>
    </div>
  )
}
