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
  metadataBase: new URL('https://minutesdelivery.com'),

  title: {
    default: 'Minutes Delivery - Fresh Meat & Marinated Delivery in Udumalpet',
    template: '%s | Minutes Delivery',
  },

  description:
    'Order fresh meat and marinated chicken, seafood, and more in Udumalpet. Minutes Delivery offers fast, hygienic, and doorstep delivery of fresh cuts and ready-to-cook items.',

  keywords: [
    'minutes delivery',
    'minutesdelivery',
    'fresh meat delivery Udumalpet',
    'chicken delivery Udumalpet',
    'marinated chicken Udumalpet',
    'seafood delivery Udumalpet',
    'online meat delivery Tamil Nadu',
    'fresh chicken near me',
    'marinated meat delivery',
    'instant meat delivery Udumalpet',
  ],

  openGraph: {
    title: 'Minutes Delivery - Fresh Meat in Udumalpet',
    description:
      'Fresh and marinated meat delivery in Udumalpet with fast doorstep service.',
    url: 'https://minutesdelivery.com',
    siteName: 'Minutes Delivery',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'Minutes Delivery - Fresh Meat Udumalpet',
      },
    ],
    type: 'website',
    locale: 'en_IN',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Minutes Delivery - Fresh Meat Udumalpet',
    description: 'Order fresh and marinated meat online in Udumalpet.',
    images: ['/android-chrome-512x512.png'],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
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
