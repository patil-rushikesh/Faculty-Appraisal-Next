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

    const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/faculties`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    })

    return NextResponse.json(res.data, { status: res.status })
  } catch (error) {
    console.error("Faculty API Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch faculty members" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      )
    }

    const body = await req.json()
    
    const res = await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/delete-user`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: body,
      validateStatus: () => true,
    })

    return NextResponse.json(res.data, { status: res.status })
  } catch (error) {
    console.error("Delete Faculty API Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete faculty member" },
      { status: 500 }
    )
  }
}
