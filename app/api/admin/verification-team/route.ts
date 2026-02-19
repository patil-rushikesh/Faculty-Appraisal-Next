import { NextResponse } from "next/server"


export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      )
    }

    const body = await req.json()
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/verification-committee`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }
    catch (error) {
    console.error("Create Verification Committee API Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create verification committee" },
      { status: 500 }
    )
  }
}