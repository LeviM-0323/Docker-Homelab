import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAccount, getSessionCookieName } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const cookieStore = await cookies();
  let account;
  try {
    account = await getAuthenticatedAccount(
      cookieStore.get(getSessionCookieName())?.value,
    );
  } catch {
    console.error("Account page failed because the authentication service is unavailable.");
    throw new Error("Account service is temporarily unavailable.");
  }

  if (!account) {
    redirect("/login");
  }

  return (
    <main className="route-main">
      <p className="route-kicker">ACCOUNT</p>
      <h1 className="route-title">Your account</h1>
      <p className="route-intro">Signed in as {account.username}.</p>
    </main>
  );
}
