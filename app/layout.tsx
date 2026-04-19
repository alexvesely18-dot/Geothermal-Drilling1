import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GeoPivot — Geothermal Pilot Decision Support',
  description:
    'AI-powered decision support for drilling firms evaluating geothermal pilot opportunities in the Salton Sea / Imperial Valley.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
