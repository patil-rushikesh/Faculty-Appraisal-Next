"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { fadeInUp } from "@/lib/animations"
import { COPYRIGHT_TEXT } from "@/lib/constants"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Loader from "@/components/loader"

interface AuthFormProps {
  type: "login" | "register"
  onSubmit: (data: any) => void
}

export default function AuthForm({ type, onSubmit }: AuthFormProps) {
  const [formData, setFormData] = useState({
    userId: "",
    password: ""
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onSubmit(formData)
    setIsLoading(false)
  }



  return (
    <motion.div className="w-full max-w-md" variants={fadeInUp} initial="hidden" animate="visible">
      <Card className="border-border">
        <CardHeader className="flex flex-col items-center justify-center">
          <CardTitle className="text-2xl font-serif font-bold">Welcome</CardTitle>
          <CardDescription className="text-muted-foreground">
            Please Login to Continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId" className="font-bold text-lg">User ID</Label>
              <Input
                id="userId"
                name="userId"
                type="text"
                placeholder="Enter your User ID"
                value={formData.userId}
                onChange={handleChange}
                required
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-lg">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                className="text-lg"
              />
            </div>

            <div className="text-center">
              <Link href="/forgot-password">
                <Button
                  type="button"
                  variant="link"
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-bold transition-colors"
                >
                  Forgot Password?
                </Button>
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader variant="inline" className="mr-2" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center mt-4 text-xs text-gray-500 font-semibold">
              {COPYRIGHT_TEXT}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
