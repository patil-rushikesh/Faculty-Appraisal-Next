import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { department: string } }
) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const department = params.department;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/${department}/interaction-deans`,
      {
        method: "GET",
        headers,
        credentials: "include",
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Interaction Deans GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch interaction deans" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { department: string } }
) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const department = params.department;
    const body = await req.json();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/${department}/assign-interaction-deans`,
      {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Interaction Deans POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to assign interaction deans" },
      { status: 500 }
    );
  }
}
