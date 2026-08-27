"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AuthService } from "@/server/services/auth.service";
import { ProfileService } from "@/server/services/profile.service";

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

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Success / Error States
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validation States
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const validateForm = () => {
    let isValid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setError(null);

    // Validate Full Name
    if (!fullName.trim()) {
      setNameError("Full name is required");
      isValid = false;
    }

    // Validate Email
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

    // Validate Password
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    // Validate Confirm Password
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    return isValid;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    startTransition(async () => {
      let data;
      try {
        data = await AuthService.signUp(email.trim(), password, fullName.trim());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not sign up. Please try again.");
        return;
      }

      if (data.user && data.session) {
        // Email confirmation is off — we're already signed in.
        await ProfileService.ensureProfile(data.user);
        router.push("/");
        router.refresh();
      } else {
        setSuccessMessage(
          "Please check your inbox to confirm your email and complete your registration.",
        );
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-section px-4 py-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm my-auto">
        {/* Header section with brand logo */}
        <div className="flex flex-col items-center">
          <Image
            src="/images/logo.png"
            alt="SmartLogix"
            width={911}
            height={285}
            priority
            className="h-7 w-auto"
          />
          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-black">
            Create your account
          </h2>
          <p className="mt-1 text-center text-sm text-slate">
            Enter your details below to get started
          </p>
        </div>

        {successMessage ? (
          <div className="space-y-3 rounded-lg border border-border bg-surface p-4 text-sm text-black">
            <div>
              <p className="font-semibold">Registration Successful!</p>
              <p className="mt-0.5 text-slate">{successMessage}</p>
            </div>
            <div className="border-t border-border pt-1">
              <Link
                href="/login"
                className="inline-flex items-center text-xs font-bold text-black hover:underline"
              >
                Proceed to Sign In &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Global Error Banner */}
            {error && (
              <div className="rounded-lg border border-border bg-surface p-3 text-sm text-black">
                <p className="font-medium">Registration failed</p>
                <p className="mt-0.5 text-slate">{error}</p>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-4" noValidate>
          {/* Full Name input field */}
          <div className="space-y-1">
            <label htmlFor="fullName" className="text-sm font-semibold text-black block">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (nameError) setNameError(null);
              }}
              disabled={isPending}
              className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-black outline-none placeholder:text-muted transition-all focus:border-transparent focus:ring-2 focus:ring-black ${
                nameError ? "border-black" : "border-border"
              }`}
              placeholder="John Doe"
            />
            {nameError && (
              <span className="text-xs text-black font-medium block mt-1">{nameError}</span>
            )}
          </div>

          {/* Email input field */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-semibold text-black block">
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
              className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-black outline-none placeholder:text-muted transition-all focus:border-transparent focus:ring-2 focus:ring-black ${
                emailError ? "border-black" : "border-border"
              }`}
              placeholder="name@example.com"
            />
            {emailError && (
              <span className="text-xs text-black font-medium block mt-1">{emailError}</span>
            )}
          </div>

          {/* Password input field */}
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-semibold text-black block">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                disabled={isPending}
                className={`w-full rounded-lg border bg-white pl-3.5 pr-10 py-2 text-sm text-black outline-none placeholder:text-muted transition-all focus:border-transparent focus:ring-2 focus:ring-black ${
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
              <span className="text-xs text-black font-medium block mt-1">{passwordError}</span>
            )}
          </div>

          {/* Confirm Password input field */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm font-semibold text-black block">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError(null);
                }}
                disabled={isPending}
                className={`w-full rounded-lg border bg-white pl-3.5 pr-10 py-2 text-sm text-black outline-none placeholder:text-muted transition-all focus:border-transparent focus:ring-2 focus:ring-black ${
                  confirmPasswordError ? "border-black" : "border-border"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={isPending}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-black transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {confirmPasswordError && (
              <span className="text-xs text-black font-medium block mt-1">
                {confirmPasswordError}
              </span>
            )}
          </div>

          {/* Signup Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center rounded-full bg-primary py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
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
                <span>Creating account...</span>
              </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

            {/* Footer Navigation Link */}
            <div className="pt-3 text-center">
              <p className="text-sm text-slate">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-black hover:underline transition-all">
                  Sign In
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
