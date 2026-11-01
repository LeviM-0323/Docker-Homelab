import {
  getAuthenticatedAccount,
  getSessionCookieName,
} from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${getSessionCookieName()}=`))
    ?.slice(getSessionCookieName().length + 1);

  try {
    const account = await getAuthenticatedAccount(token);
    if (!account) {
      return Response.json(
        { error: "Authentication required." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    return Response.json(account, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    console.error("Account request failed because the authentication service is unavailable.");
    return Response.json(
      { error: "Account service is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
