import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminPassword, isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({ authenticated });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode } = body;
    const expected = getAdminPassword();

    if (!passcode || passcode.trim() !== expected.trim()) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, authenticated: true });
    response.cookies.set(ADMIN_COOKIE_NAME, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, authenticated: false });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
