"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { AuthService } from "@/server/services/auth.service";

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center bg-section" />}
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Error States
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateForm = () => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setError(null);

    // Validate email presence and format
    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Please enter a valid email address");
        isValid = false;
      }
    }

    // Validate password presence and minimum length
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    startTransition(async () => {
      try {
        await AuthService.login(email.trim(), password, { rememberMe });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not sign in. Please try again.");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-section px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-white p-8 shadow-sm">
        {/* Header section with brand logo */}
        <div className="flex flex-col items-center">
          <Image
            src="/images/logo.png"
            alt="SmartLogix"
            width={911}
            height={285}
            priority
            className="h-8 w-auto"
          />
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-black">
            Sign in to SmartLogix
          </h2>
          <p className="mt-2 text-center text-sm text-slate">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="rounded-lg border border-border bg-surface p-3 text-sm text-black">
            <p className="font-medium">Sign-in failed</p>
            <p className="mt-0.5 text-slate">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6" noValidate>
          {/* Email input field */}
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-black block"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              disabled={isPending}
              className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-black outline-none placeholder:text-muted transition-all focus:border-transparent focus:ring-2 focus:ring-black ${
                emailError ? "border-black" : "border-border"
              }`}
              placeholder="name@example.com"
            />
            {emailError && (
              <span className="text-xs text-black font-medium block mt-1">
                {emailError}
              </span>
            )}
          </div>

          {/* Password input field */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-black block"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                disabled={isPending}
                className={`w-full rounded-lg border bg-white pl-3.5 pr-10 py-2.5 text-sm text-black outline-none placeholder:text-muted transition-all focus:border-transparent focus:ring-2 focus:ring-black ${
                  passwordError ? "border-black" : "border-border"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isPending}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-black transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {passwordError && (
              <span className="text-xs text-black font-medium block mt-1">
                {passwordError}
              </span>
            )}
          </div>

          {/* Remember me / Forgot password row */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-border text-black accent-black focus:ring-2 focus:ring-black"
              />
              Remember me
            </label>
            <Link
              href="#"
              className="text-xs font-medium text-slate hover:text-black transition-colors"
              onClick={(e) => e.preventDefault()} // Placeholder, not implemented yet
            >
              Forgot password?
            </Link>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer Navigation Link */}
        <div className="pt-4 text-center">
          <p className="text-sm text-slate">
            Don&apos;t have an account?{" "}
            <Link
              href={
                redirectTo !== "/"
                  ? `/signup?redirect=${encodeURIComponent(redirectTo)}`
                  : "/signup"
              }
              className="font-semibold text-black hover:underline transition-all"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
