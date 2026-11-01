import {
  authenticate,
  createSession,
  serializeSessionCookie,
} from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const genericFailure = { error: "Invalid username/email or password." };

function invalidRequest(message: string, status = 400) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return invalidRequest("Send login details as JSON.", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) {
    return invalidRequest("Login request is too large.", 413);
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > 4096) {
      return invalidRequest("Login request is too large.", 413);
    }
    body = JSON.parse(text);
  } catch {
    return invalidRequest("Login request must contain valid JSON.");
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("identifier" in body) ||
    typeof body.identifier !== "string" ||
    !("password" in body) ||
    typeof body.password !== "string" ||
    body.identifier.trim().length === 0 ||
    body.identifier.length > 320 ||
    body.password.length === 0 ||
    body.password.length > 1024
  ) {
    return invalidRequest("Enter your username or email and password.");
  }

  try {
    const account = await authenticate(body.identifier.trim(), body.password);
    if (!account) {
      return Response.json(genericFailure, {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const token = await createSession(account.id);
    return Response.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store",
          "Set-Cookie": serializeSessionCookie(token),
        },
      },
    );
  } catch {
    console.error("Login request failed because the authentication service is unavailable.");
    return invalidRequest("Sign-in is temporarily unavailable.", 503);
  }
}
