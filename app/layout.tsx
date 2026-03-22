import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartDrawer } from '@/components/cart-drawer'
import { AuthProvider } from '@/hooks/useAuth'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as HotToaster } from "react-hot-toast"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Minutes Delivery - Fast & Fresh',
  description: 'Fresh cut and marinated chicken and fish delivered in 30 minutes. Fast & Fresh delivery service.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <CartDrawer />
          <Toaster />
          <HotToaster
            position="top-center"
            containerStyle={{
              top: 80,
            }}
            gutter={12}
            toastOptions={{
              style: {
                borderRadius: '12px',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                padding: '12px 16px',
                maxWidth: '420px',
              },
              success: {
                iconTheme: { primary: '#16a34a', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#dc2626', secondary: '#fff' },
              },
            }}
          />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
