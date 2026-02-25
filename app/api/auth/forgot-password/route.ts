import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      )
    }

    const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/forgot-password`, { email }, {
      headers: { "Content-Type": "application/json" },
      validateStatus: () => true,
    })

    return NextResponse.json(res.data, { status: res.status })
  } catch (error) {
    console.error("Forgot password API Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to process forgot password request" },
      { status: 500 }
    )
  }
}
