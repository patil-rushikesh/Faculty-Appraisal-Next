import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/common/faculties`, {
      headers,
      validateStatus: () => true,
    });

    return NextResponse.json(res.data, { status: res.status });
  } catch (error) {
    console.error("All Faculties API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch all faculties" },
      { status: 500 }
    );
  }
}
