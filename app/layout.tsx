import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import CookieBanner from '@/components/CookieBanner'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MecAI',
  description: 'AI-powered mechanical engineering assistant',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-logo.jpg', sizes: '512x512', type: 'image/jpeg' },
    ],
    shortcut: '/favicon-32.png',
    apple: '/favicon-logo.jpg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Neue+Montreal:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body className={dmSans.className}>
        <Providers>{children}</Providers>
        <CookieBanner />
      </body>
    </html>
  )
}