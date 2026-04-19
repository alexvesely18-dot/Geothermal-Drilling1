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
            Salton Sea / Imperial Valley, California
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
            Should your company{' '}
            <span className="text-cyan-400">pivot to geothermal?</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            GeoPivot combines your company's drilling capabilities with site-level
            seismic data — powered by Scripps Institution of Oceanography simulation data —
            to deliver a clear <strong className="text-white">Go / Conditional Go / No-Go</strong>{' '}
            recommendation for a Salton Sea geothermal pilot.
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
          <p className="text-slate-500 text-sm mt-4">3 minutes · No account required · PDF export included</p>
        </div>
      </section>

      {/* What is Salton Sea geothermal? */}
      <section className="bg-white border-t border-gray-100 px-6 py-14">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              What is Salton Sea geothermal?
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              The Salton Sea / Imperial Valley region in Southern California sits atop one
              of the most powerful geothermal resources in the world. The area produces
              around 640 MW of clean electricity today — and the US Department of Energy
              estimates the region could support over 2,500 MW of additional capacity.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              For oil and gas drilling companies, this is a natural adjacency. The same rigs,
              crews, and subsurface expertise used in conventional drilling translate directly
              to geothermal wells. California's Renewable Portfolio Standard, the Lithium Valley
              Act, and federal IRA incentives make the economics increasingly compelling.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              The key question isn't <em>whether</em> geothermal is an opportunity — it's{' '}
              <em>which site, at what scale, and with what risk profile</em> fits your
              company right now. That's exactly what GeoPivot answers.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              5 candidate zones evaluated
            </p>
            {[
              { name: 'Salton Sea Geothermal Field', tag: 'Highest temp in continental US', risk: 'high' },
              { name: 'Brawley Seismic Zone',        tag: 'Lithium + power upside',         risk: 'high' },
              { name: 'Calipatria North Zone',       tag: 'Lowest capex entry point',        risk: 'medium' },
              { name: 'East Mesa',                   tag: 'First-operator friendly',         risk: 'medium' },
              { name: 'Heber Geothermal Field',      tag: 'Best infrastructure',             risk: 'low' },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.tag}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  s.risk === 'high'   ? 'bg-red-100 text-red-700' :
                  s.risk === 'medium' ? 'bg-amber-100 text-amber-700' :
                                        'bg-green-100 text-green-700'
                }`}>
                  {s.risk} seismic
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="bg-gray-50 border-t border-gray-200 px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: '⚡',
              title: 'Capability Matching',
              desc: 'Rig fleet, drilling depth, temperature tolerance, crew expertise, and budget scored against each site.',
            },
            {
              icon: '🌋',
              title: 'iPOD Seismic Model',
              desc: 'PGV predictions from the Scripps Institution of Oceanography iPOD reduced-order model — not just static PGA lookups.',
            },
            {
              icon: '📊',
              title: 'Compare & Export',
              desc: 'Evaluate up to 3 sites side by side, adjust budget with live scoring, then download a PDF or share a link.',
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
        GeoPivot · Seismic data: Scripps Institution of Oceanography iPOD ROM · For evaluation purposes only
      </footer>
    </div>
  )
}
