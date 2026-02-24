import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]
    const body = await req.json()
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      )
    }

    const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/change-password`, body, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    })

    return NextResponse.json(res.data, { status: res.status })
  } catch (error) {
    console.error("Change password API Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to change password" },
      { status: 500 }
    )
  }
}
