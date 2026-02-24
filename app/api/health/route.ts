import { NextResponse } from "next/server"
import axios from "axios"

export async function GET() {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/health`, {
      validateStatus: () => true,
    })
    return NextResponse.json(res.data, { status: res.status })
  } catch (error) {
    console.error("Health check API Error:", error)
    return NextResponse.json(
      { status: "error", message: "Failed to connect to backend" },
      { status: 500 }
    )
  }
}
