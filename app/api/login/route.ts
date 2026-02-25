import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`;

    const res = await axios.post(apiUrl, body, {
      headers: { "Content-Type": "application/json" },
      validateStatus: () => true,
    });

    const data = res.data;
    const setCookieHeader = res.headers["set-cookie"];
    const response = NextResponse.json(data, { status: res.status });

    if (setCookieHeader) {
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader.split(/,(?=[^;]+?=)/g);
      for (const cookie of cookies) {
        response.headers.append("Set-Cookie", cookie);
      }
    }

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
