import { NextResponse } from "next/server"

export async function GET(req: Request, context: { params: Promise<{ department: string }> }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      )
    }

    const { department } = await context.params;
    if (!department) {
      return NextResponse.json(
        { success: false, message: "Department parameter is required" },
        { status: 400 }
      )
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/verification-committee/${department}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Get Verification Committee API Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch verification committee" },
      { status: 500 }
    )
  }
}
