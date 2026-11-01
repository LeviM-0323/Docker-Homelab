"use client";

import { useState, type FormEvent } from "react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          identifier: formData.get("identifier"),
          password: formData.get("password"),
        }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error ?? "Sign-in failed.");
        return;
      }

      window.location.assign("/account");
    } catch {
      setError("Sign-in is temporarily unavailable. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label htmlFor="identifier">Username or email</label>
      <input
        autoComplete="username"
        id="identifier"
        maxLength={320}
        name="identifier"
        required
      />
      <label htmlFor="password">Password</label>
      <input
        autoComplete="current-password"
        id="password"
        maxLength={1024}
        name="password"
        required
        type="password"
      />
      {error ? (
        <p className="login-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button-link" disabled={pending} type="submit">
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
