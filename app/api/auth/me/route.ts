import { NextResponse } from "next/server"
import axios from "axios"

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      )
    }

    const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    })

    return NextResponse.json(res.data, { status: res.status })
  } catch (error) {
    console.error("Auth me API Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to get user info" },
      { status: 500 }
    )
  }
}
