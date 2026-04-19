import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Analytics — GeoPivot',
  description:
    'Explore Salton Sea site seismic ROM statistics, cross-site comparisons, and reference pilot scores.',
}

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return children
}
