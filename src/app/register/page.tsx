"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Registration failed.");

      const login = await signIn("credentials", { email, password, callbackUrl: "/account", redirect: false });
      if (login?.error) throw new Error("Account created, but sign in failed. Please try logging in.");
      router.push("/account");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strengthScore = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strengthScore];
  const strengthColor = ["", "var(--error)", "var(--warning)", "#A3E635", "var(--success)"][strengthScore];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow orbs */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 450,
          height: 450,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 440, position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Create your account
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Create your private Sendiee Vision workspace
          </p>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "32px",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Google sign-up */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/account" })}
            id="google-register-btn"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-hover)",
              borderRadius: "var(--radius-md)",
              padding: "11px 16px",
              color: "var(--text-primary)",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "background 0.15s ease, border-color 0.15s ease",
              marginBottom: 20,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-hover)";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ fontSize: 13, color: "var(--error)" }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label htmlFor="register-name" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="input-base"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="register-email" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Email address
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sendiee.com"
                className="input-base"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="register-password" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="input-base"
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 2 }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {/* Password strength */}
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 99,
                          background: i <= strengthScore ? strengthColor : "var(--border)",
                          transition: "background 0.2s ease",
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: strengthColor, marginTop: 4, fontWeight: 500 }}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="register-confirm" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Confirm Password
              </label>
              <input
                id="register-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="input-base"
                required
                autoComplete="new-password"
                style={{ borderColor: confirm && confirm !== password ? "var(--error)" : undefined }}
              />
              {confirm && confirm !== password && (
                <p style={{ fontSize: 12, color: "var(--error)", marginTop: 4 }}>Passwords don&apos;t match</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              id="register-submit-btn"
              style={{ marginTop: 4, width: "100%", height: 44, fontSize: 15 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 20 }}>
          By creating an account, you agree to Sendiee&apos;s Terms of Service.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
