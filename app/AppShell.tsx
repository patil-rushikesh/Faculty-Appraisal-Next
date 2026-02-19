"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/app/AuthProvider"
import { Toaster } from "@/components/ui/toaster"

const PUBLIC_ROUTES = new Set(["/", "/forgot-password", "/reset-password"])

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const shouldShowSidebar = !!user && !PUBLIC_ROUTES.has(pathname)

  if (!shouldShowSidebar) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  return (
    <>
      <div className="flex min-h-screen bg-background overflow-hidden">
        <Sidebar
          userRole={user.role}
          isOpen={sidebarOpen}
          isExpanded={sidebarExpanded}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
          onOpen={() => setSidebarOpen(true)}
        />
        <main
          className={ `flex-1 overflow-y-auto transition-all duration-300 ${
            sidebarExpanded ? "lg:ml-72" : "lg:ml-20"
          }`}
        >
          {children}
        </main>
      </div>
      <Toaster />
    </>
  )
}
