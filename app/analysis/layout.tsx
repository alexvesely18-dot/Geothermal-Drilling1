import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Analytics | GeoPivot',
  description:
    'Assessment-linked data analytics for geothermal site comparison and sensitivity testing.',
}

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return children
}
