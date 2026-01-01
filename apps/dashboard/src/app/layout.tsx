import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VGrok Agent Dashboard',
  description: 'Cloud Coding & Automation Agent Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
