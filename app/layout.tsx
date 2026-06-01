import type { Metadata, Viewport } from "next"
import { Inter, Source_Sans_3 } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans" })

export const metadata: Metadata = {
  title: "Biblioteca 2.0 - TecNM",
  description:
    "Sistema de prestamo de libros fisicos y gestion de salas de estudio del Tecnologico Nacional de Mexico",
}

export const viewport: Viewport = {
  themeColor: "#4AADE8",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${sourceSans.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  )
}
