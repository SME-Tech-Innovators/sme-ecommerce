"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { postForgotPassword } from "@/apis/auth";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();

    setIsSubmitting(true);
    const result = await postForgotPassword(email);
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.errorMessage);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-5 py-12 sm:px-6">
        <div className="rounded-md border border-primary-blue/15 bg-blue-gray/40 px-6 py-8">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-blue/55">
            SME Operations
          </p>
          <h1 className="mt-3 font-serif text-2xl font-light tracking-tight text-primary-blue">
            Check your inbox
          </h1>
          <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
            If that email address is registered, we&apos;ve sent a password
            reset link. The link expires in <strong>1 hour</strong>.
          </p>
          <p className="mt-4 font-sans text-sm leading-relaxed text-muted-foreground">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="font-medium text-primary-blue underline decoration-primary-blue/30 underline-offset-4 hover:decoration-primary-blue"
            >
              try again
            </button>
            .
          </p>
        </div>

        <p className="mt-8">
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

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-5 py-12 sm:px-6">
      <header className="mb-10">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-primary-blue/55">
          SME Operations
        </p>
        <h1 className="mt-3 font-serif text-[clamp(1.85rem,4vw,2.5rem)] font-light leading-[1.12] tracking-tight text-primary-blue">
          Reset your password
        </h1>
        <p className="mt-3 font-sans text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          Enter the email address you registered with and we&apos;ll send you a
          reset link.
        </p>
      </header>

      <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
        <div>
          <label
            htmlFor="forgot-email"
            className="mb-2 block font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Business email
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@yourshop.co.za"
            className="w-full border border-primary-blue/15 bg-white px-4 py-3 font-sans text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground/50 focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/20"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-blue px-6 py-3.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-primary-blue/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-blue disabled:pointer-events-none disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-8 font-sans text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link
          href="/signin"
          className="font-medium text-primary-blue underline decoration-primary-blue/30 underline-offset-4 transition-colors hover:decoration-primary-blue"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-6">
        <Link
          href="/"
          className="font-sans text-sm font-medium text-primary-blue/80 underline decoration-primary-blue/25 underline-offset-4 transition-colors hover:text-primary-blue"
        >
          ← Back to homepage
        </Link>
      </p>
    </div>
  );
}
