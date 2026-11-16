import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "rattafy_admin_session";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "ipsa1155";
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!sessionCookie) return false;
    return sessionCookie.value === "authenticated";
  } catch {
    return false;
  }
}

export { ADMIN_COOKIE_NAME };
