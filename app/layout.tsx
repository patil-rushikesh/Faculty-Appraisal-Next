import type React from "react"
import { Montserrat, Open_Sans } from "next/font/google"
import "./globals.css"
import AuthProvider from "./AuthProvider"
import { cookies } from "next/headers"
import AppShell from "./AppShell"
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["600", "700", "800"],
})

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  const cookieStore = cookies();
  const token = (await cookieStore).get("access_token")?.value || null;
  let initialUser = null;
  try {
    const rawUser = (await cookieStore).get("user")?.value;
    if (rawUser) {
      const decoded = decodeURIComponent(rawUser);
      initialUser = JSON.parse(decoded);
    }
  } catch (err) {
    console.error("Error parsing user cookie:", err);
  }

  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${openSans.variable} font-sans antialiased`}>
        <AuthProvider preToken={token} initialUser={initialUser}>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
