"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./AuthProvider"
import { motion } from "framer-motion"
import AuthForm from "@/components/auth-form"
import Loader from "@/components/loader"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const { login, user } = useAuth()

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && user.role) {
      const normalizeRole = (role: string) => {
        const r = role.toLowerCase();
        // Map role values to route paths
        if (r === "associate_dean") return "associate_dean";
        if (r === "director") return "director";
        if (r === "hod") return "hod";
        if (r === "dean") return "dean";
        if (r === "admin") return "admin";
        if (r === "faculty") return "faculty";
        return r;
      };
      
      const rolePath = normalizeRole(user.role);
      router.push(`/${rolePath}/dashboard`);
    } else {
      // User is not logged in, stop showing loader
      setIsCheckingAuth(false);
    }
  }, [user, router]);


  const handleLogin = async (data: any) => {
    setError("")
    setIsLoading(true)

    try {
      const result = await login({ userId: data.userId, password: data.password })
      if (!result.ok) {
        setError(result.error || "Login failed")
        return
      }
      if (result.rolePath) {
        router.push(`/${result.rolePath}/dashboard`)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false)
    }
  };

  // Show loader while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50 dark:to-slate-900 flex items-center justify-center px-4">
        <Loader variant="page" message="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50 dark:to-slate-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-4">
            <div className="w-40 h-40 flex items-center justify-center">
              <img src="/image.png" alt="Logo" className="w-40 h-40 object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Faculty Portal</h1>
          <p className="text-muted-foreground mt-2">Faculty Appraisal System</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
          >
            {error}
          </motion.div>
        )}

        <AuthForm
          type="login"
          onSubmit={handleLogin}
        />
      </div>
    </div>
  )
}