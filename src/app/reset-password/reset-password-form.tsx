"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { postResetPassword } from "@/apis/auth";

/**
 * Inner component that reads the token from the URL search params.
 * Wrapped in Suspense by the parent so Next.js static generation is happy.
 */
function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-5 py-12 sm:px-6">
        <div className="rounded-md border border-red-200 bg-red-50 px-6 py-6">
          <h1 className="font-serif text-xl font-light text-red-800">
            Invalid reset link
          </h1>
          <p className="mt-2 font-sans text-sm leading-relaxed text-red-700">
            This password reset link is missing a token. Please use the link
            sent to your email, or request a new one.
          </p>
        </div>
        <p className="mt-6">
          <Link
            href="/forgot-password"
            className="font-sans text-sm font-medium text-primary-blue underline decoration-primary-blue/30 underline-offset-4 hover:decoration-primary-blue"
          >
            Request a new reset link
          </Link>
        </p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError(null);

    if (password !== confirm) {
      setFieldError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setFieldError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    const result = await postResetPassword(token, password);
    setIsSubmitting(false);

    if (!result.ok) {
      if (
        result.errorCode === "INVALID_TOKEN" ||
        result.errorCode === "TOKEN_EXPIRED"
      ) {
        toast.error(result.errorMessage, {
          description: "Request a new reset link to try again.",
          duration: 8000,
        });
      } else {
        toast.error(result.errorMessage);
      }
      return;
    }

    toast.success("Password updated. Please sign in with your new password.");
    router.push("/signin");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-5 py-12 sm:px-6">
      <header className="mb-10">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-primary-blue/55">
          SME Operations
        </p>
        <h1 className="mt-3 font-serif text-[clamp(1.85rem,4vw,2.5rem)] font-light leading-[1.12] tracking-tight text-primary-blue">
          Set a new password
        </h1>
        <p className="mt-3 font-sans text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          Choose a strong password. Must be at least 8 characters with an
          uppercase letter, a number, and a special character.
        </p>
      </header>

      <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
        <div>
          <label
            htmlFor="reset-password"
            className="mb-2 block font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            New password
          </label>
          <input
            id="reset-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full border border-primary-blue/15 bg-white px-4 py-3 font-sans text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground/50 focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/20"
          />
        </div>

        <div>
          <label
            htmlFor="reset-confirm"
            className="mb-2 block font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full border border-primary-blue/15 bg-white px-4 py-3 font-sans text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground/50 focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/20"
          />
        </div>

        {fieldError ? (
          <p
            role="alert"
            className="font-sans text-xs text-red-700"
          >
            {fieldError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-blue px-6 py-3.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-primary-blue/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-blue disabled:pointer-events-none disabled:opacity-60"
        >
          {isSubmitting ? "Updating password…" : "Update password"}
        </button>
      </form>

      <p className="mt-8">
        <Link
          href="/forgot-password"
          className="font-sans text-sm text-muted-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:text-foreground"
        >
          Need a new reset link?
        </Link>
      </p>

      <p className="mt-4">
        <Link
          href="/signin"
          className="font-sans text-sm font-medium text-primary-blue/80 underline decoration-primary-blue/25 underline-offset-4 transition-colors hover:text-primary-blue"
        >
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-5 py-12">
          <p className="font-sans text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
}
