'use client'

import NextTopLoader from 'nextjs-toploader'

export default function AppTopLoader() {
  return (
    <NextTopLoader
      color="linear-gradient(90deg, #0ea5e9 0%, #38bdf8 50%, #2563eb 100%)"
      height={5}
      showSpinner={false}
      shadow="0 0 12px rgba(56, 189, 248, 0.6)"
      showAtBottom
    />
  )
}
