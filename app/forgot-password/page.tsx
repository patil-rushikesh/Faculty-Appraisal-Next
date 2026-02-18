"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import { COPYRIGHT_TEXT } from "@/lib/constants"
import Loader from "@/components/loader"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to send password reset link")
        return
      }

      setSuccess("Password reset link has been sent to your email address. Please check your email to reset your password.")
    } catch (err) {
      setError("Failed to connect to the server. Please try again.")
    } finally {
      setIsLoading(false)
    }
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
          <p className="text-muted-foreground mt-2">Password Recovery</p>
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

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm"
          >
            {success}
          </motion.div>
        )}

        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-border">
            <CardHeader className="flex flex-col items-center justify-center">
              <CardTitle className="text-2xl font-serif font-bold">
                Forgot Password
              </CardTitle>
              <CardDescription className="text-muted-foreground text-center">
                Please enter the email address you used while registering your account. We'll send a password reset link to your email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendResetLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-lg flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-lg"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader variant="inline" className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <div className="text-center">
                  <Link href="/">
                    <Button
                      type="button"
                      variant="link"
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-bold transition-colors flex items-center gap-2 mx-auto"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </form>

              <div className="text-center mt-4 text-xs text-gray-500 font-semibold">
                {COPYRIGHT_TEXT}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
