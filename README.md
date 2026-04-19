#  GeoPivot — Geothermal Pilot Decision Support

> **"GeoPivot analyzes your drilling capabilities, budget, and risk tolerance against real Salton Sea seismic and economic data to recommend the best geothermal pilot site."**

🔗 **Live Demo:** [geothermal-drilling1.vercel.app](https://geothermal-drilling1.vercel.app)

---

## The Problem

The energy transition is creating a once-in-a-generation opportunity for oil and gas companies to pivot to geothermal — but most don't know if their existing rigs, crews, and capital actually make it viable. The Salton Sea region sits on one of the most promising untapped geothermal resources in the US, yet decision-makers lack a fast, data-backed way to evaluate it.

## What GeoPivot Does

GeoPivot is a **3-minute decision-support tool** that takes a company's drilling capabilities, budget, timeline, and risk tolerance and scores them against 5 real Salton Sea candidate sites. It delivers a clear **Go / Conditional Go / No-Go** recommendation — no consultants required.

Key features:
- **Capability Matching** — rig fleet, drilling depth, crew expertise, and budget scored against site-specific requirements
- **Seismic Risk Overlay** — PGA, fault proximity, and historical seismicity data backed by Rekoske et al. (2023, JGR) physics-based PGV simulations
- **Economic & Policy Analysis** — IRA incentives, California electricity prices, and geothermal capacity factor baked into the viability score
- **AI-Powered Explanation** — Claude explains the reasoning behind each recommendation in plain language

---


---

## Built With

| Category | Technologies |
|---|---|
| **Languages** | TypeScript, Python |
| **Framework** | Next.js 14, React, Tailwind CSS |
| **AI** | Anthropic Claude API (`claude-sonnet-4-6`), Claude Code |
| **Deployment** | Vercel Pro, GitHub |
| **Data** | HDF5 (Rekoske et al. 2023 PGV maps via Zenodo), h5py, NumPy, SciPy |
| **SDK** | Anthropic SDK, Node.js |

---

## How We Built It

GeoPivot was built with the assistance of **Claude Code**.

- Generated the 4-step assessment wizard, deterministic scoring engine, SVG Salton Sea map component, and API routes
- Seismic data sourced from **Rekoske et al. (2023), JGR**, a physics-based PGV ground motion simulations published on [Zenodo](https://zenodo.org/records/8170242)
- Deployed to Vercel with automatic GitHub integration

---

## Getting Started

### Prerequisites
- Node.js 18+
- An Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/alexvesely18-dot/Geothermal-Drilling1.git
cd Geothermal-Drilling1

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Environment Variables

```env
ANTHROPIC_API_KEY=your_api_key_here
```

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
├── app/
│   ├── page.tsx              # Landing page
│   ├── assess/page.tsx       # 4-step assessment wizard
│   └── api/
│       ├── analyze/          # Scoring API route
│       └── explain/          # AI explanation route
├── components/
│   └── SaltonSeaMap.tsx      # SVG interactive map
├── data/
│   └── sites.ts              # 5 Salton Sea sites with real-world data
└── lib/
    └── scoring.ts            # Deterministic scoring engine
```

---

## Data Sources

| Data | Source |
|---|---|
| PGV Ground Motion Maps | Rekoske, J. M., Gabriel, A.-A., & May, D. A. (2023). *Instantaneous physics-based ground motion maps using reduced-order modeling.* JGR: Solid Earth. [DOI](https://doi.org/10.1029/2023JB026975) |
| Seismic Hazard | USGS National Seismic Hazard Model |
| IRA Incentives | U.S. Department of Energy Geothermal Technologies Office |

---

## What's Next

- [ ] PDF report export for stakeholder sharing
- [ ] Sensitivity sliders — adjust budget/timeline and watch the score update live
- [ ] Expand to Great Basin, Hawaii, and Pacific Northwest using DOE Geothermal Data Repository
- [ ] Pre-built company profiles for faster demos

---

## Team

Built at DataHacks 2026· April 2026

---

## License

MIT
