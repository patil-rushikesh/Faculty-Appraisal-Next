import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Token and new password are required" },
        { status: 400 }
      )
    }

    const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/reset-password`, { token, newPassword }, {
      headers: { "Content-Type": "application/json" },
      validateStatus: () => true,
    })

    return NextResponse.json(res.data, { status: res.status })
  } catch (error) {
    console.error("Reset password API Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to reset password" },
      { status: 500 }
    )
  }
}
