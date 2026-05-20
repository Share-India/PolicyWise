import type React from "react"
import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

import { UnderwritingProvider } from "@/context/underwriting-context"
import { PageLoader } from "@/components/ui/page-loader"
import { Toaster } from "sonner"
import { Suspense } from "react"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
  generator: siteConfig.company,
  icons: {
    icon: [
      {
        url: "/share-india-new.png",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-inter antialiased bg-slate-50`} suppressHydrationWarning>
        {/* Premium Background Mesh */}
        <div className="fixed inset-0 min-h-screen w-full -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-si-blue-primary/5 via-transparent to-transparent opacity-60"></div>
        <div className="fixed inset-0 min-h-screen w-full -z-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-si-blue-secondary/5 via-transparent to-transparent opacity-60"></div>

        <Suspense fallback={null}>
          <PageLoader />
        </Suspense>
        <UnderwritingProvider>
          {children}
          {/* Floating Monogram */}
          <div className="fixed bottom-6 right-6 z-50 opacity-40 hover:opacity-100 hover:scale-105 transition-all duration-500 ease-out cursor-pointer drop-shadow-lg">
            <img src="/share-india-monogram.png" alt={siteConfig.name} className="w-14 h-14 md:w-16 md:h-16" />
          </div>
        </UnderwritingProvider>
        <Toaster theme="light" className="!font-inter" />
        <Analytics />
      </body>
    </html>
  )
}
