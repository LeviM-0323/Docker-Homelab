import type { Metadata } from "next";
import { SubpageFooter, SubpageHeader } from "../_components/subpage-chrome";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — Levi McLean",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <>
      <SubpageHeader />
      <main className="route-main">
        <p className="route-kicker">ACCOUNT</p>
        <h1 className="route-title">Sign in</h1>
        <p className="route-intro">
          Use your username or email address and password.
        </p>
        <LoginForm />
      </main>
      <SubpageFooter />
    </>
  );
}
