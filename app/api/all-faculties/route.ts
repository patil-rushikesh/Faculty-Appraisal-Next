import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/all-faculties`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("All Faculties API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch all faculties" },
      { status: 500 }
    );
  }
}
