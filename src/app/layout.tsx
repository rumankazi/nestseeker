import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ServiceWorkerProvider } from '@/components/shared/service-worker-provider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'NestSeeker',
    template: '%s | NestSeeker',
  },
  description: 'Track and manage your house search in the Netherlands with AI assistance',
  keywords: ['house hunting', 'netherlands', 'rental', 'property search', 'funda', 'pararius'],
  authors: [{ name: 'NestSeeker' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NestSeeker',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'NestSeeker',
    title: 'NestSeeker - House Hunting Made Easy',
    description: 'Track and manage your house search in the Netherlands with AI assistance',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <TooltipProvider>
          <ServiceWorkerProvider>
            {children}
          </ServiceWorkerProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
