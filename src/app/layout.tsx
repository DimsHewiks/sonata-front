import type { Metadata } from 'next'

import './globals.css'

import AppTopLoader from '@/widgets/AppTopLoader'

export const metadata: Metadata = {
  title: 'Sonata',
  description: 'Музыкальное комьюнити',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-foreground">
          <AppTopLoader />
          {children}
        </div>
      </body>
    </html>
  )
}
