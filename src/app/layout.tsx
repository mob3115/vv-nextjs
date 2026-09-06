import type { Metadata, Viewport } from 'next'
import { Raleway } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'V+V Business Marketplace', template: '%s | V+V' },
  description: 'Buy and sell businesses based on shared values. The place where legacies find their next chapter.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://vvmarketplace.com'),
  openGraph: {
    type: 'website',
    siteName: 'V+V Business Marketplace',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E1E1E',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={raleway.variable}>
      <head>
        {/* Bebas Neue loaded via @font-face in globals.css to avoid FOUT */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Raleway:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black-deep text-white antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#242424',
              color: '#f0f0f0',
              border: '1px solid #2e2e2e',
              borderRadius: '12px',
              fontFamily: 'var(--font-raleway)',
            },
            success: { iconTheme: { primary: '#4caf7d', secondary: '#242424' } },
            error:   { iconTheme: { primary: '#d45f5f', secondary: '#242424' } },
          }}
        />
      </body>
    </html>
  )
}
