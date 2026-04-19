import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-cyan-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L9 16M2 9L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="9" cy="9" r="3" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">GeoPivot</span>
        </div>
        <span className="text-slate-400 text-sm hidden sm:block">Salton Sea Geothermal Decision Support</span>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white px-6 py-20 text-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-4 py-1.5 text-cyan-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Salton Sea / Imperial Valley Region
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
            Should your company{' '}
            <span className="text-cyan-400">pivot to geothermal?</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            GeoPivot combines your company's drilling capabilities with site-level
            seismic data, economics, and California policy to deliver a clear{' '}
            <strong className="text-white">Go / Conditional Go / No-Go</strong> recommendation
            for a Salton Sea geothermal pilot.
          </p>
          <Link
            href="/assess"
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-lg"
          >
            Start Your Assessment
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-slate-500 text-sm mt-4">Takes about 3 minutes · No account required</p>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="bg-white border-t border-gray-200 px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: '⚡',
              title: 'Capability Matching',
              desc: 'Your rig fleet, drilling depth, crew expertise, and budget are scored against site-specific requirements.',
            },
            {
              icon: '🌋',
              title: 'Seismic Risk Overlay',
              desc: 'PGA, fault proximity, and historical seismicity data for each of 5 Salton Sea candidate zones.',
            },
            {
              icon: '📊',
              title: 'Economic & Policy Analysis',
              desc: 'IRA incentives, CA electricity prices, and geothermal capacity factor baked into the viability score.',
            },
          ].map((f) => (
            <div key={f.title} className="text-center px-4">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-500 text-center text-xs py-4 px-6">
        GeoPivot · Decision support for Salton Sea geothermal pilots · For evaluation purposes only
      </footer>
    </div>
  )
}
