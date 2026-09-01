"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { listWorkspaces } from "@/apis/workspaces";
import { getAccountMeAction, loginAction } from "@/actions/auth";
import {
  persistLoginSuccess,
  persistResolvedWorkspace,
} from "@/lib/auth-login-storage";

export function SigninForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function resolveDashboardPath(
    accessToken: string | undefined,
    fallbackBusinessId?: string,
  ): Promise<string | null> {
    if (accessToken) {
      const workspaces = await listWorkspaces(accessToken).catch(() => null);
      if (workspaces?.ok && workspaces.data[0]) {
        const primary = workspaces.data[0];
        persistResolvedWorkspace({
          workspaceId: primary.id,
          businessId: primary.businessId,
          businessName: primary.name,
        });
        return `/dashboard/${primary.id}`;
      }
    }
    if (fallbackBusinessId) {
      return `/dashboard/${fallbackBusinessId}`;
    }
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    setIsSubmitting(true);
    const result = await loginAction({ email, password }).catch(() => null);

    if (!result) {
      setIsSubmitting(false);
      toast.error("Sign in could not be completed.", {
        description: "The server returned an unexpected response.",
      });
      return;
    }

    if (!result.ok) {
      setIsSubmitting(false);
      const { errorMessage, errorCode } = result;
      if (errorCode === "ACCESS_DENIED") {
        toast.error(errorMessage, {
          description:
            "Check your inbox for the verification link, then try again.",
          duration: 8000,
        });
      } else {
        toast.error(errorMessage);
      }
      return;
    }

    persistLoginSuccess(email, result.data);

    if (result.data.businessId || result.data.accessToken) {
      let accessToken = result.data.accessToken;
      let businessId = result.data.businessId;
      let profileName = result.data.fullName;

      if (!businessId && accessToken) {
        const profile = await getAccountMeAction(accessToken).catch(() => null);
        if (!profile) {
          setIsSubmitting(false);
          toast.error("Could not load your workspace profile.", {
            description:
              "Sign in worked, but /account/me failed. Check that the token is accepted by the backend.",
          });
          return;
        }
        if (!profile.ok) {
          setIsSubmitting(false);
          toast.error(profile.errorMessage);
          return;
        }
        persistLoginSuccess(email, {
          ...result.data,
          userId: profile.data.userId,
          businessId: profile.data.businessId,
          businessName: profile.data.businessName,
          publicLink: profile.data.publicLink,
          fullName: profile.data.fullName,
        });
        businessId = profile.data.businessId;
        profileName = profile.data.fullName;
      }

      const path = await resolveDashboardPath(accessToken, businessId);
      setIsSubmitting(false);

      if (!path) {
        toast.success("Signed in", {
          description:
            "Your session is saved. Open your workspace from the app when your account is fully linked.",
        });
        router.push("/");
        return;
      }

      if (profileName) {
        persistResolvedWorkspace({
          workspaceId: path.replace("/dashboard/", ""),
          businessId,
          name: profileName,
          email,
        });
      }

      toast.success("Signed in");
      router.push(path);
      return;
    }

    setIsSubmitting(false);
    toast.success("Signed in", {
      description:
        "Your session is saved. Open your workspace from the app when your account is fully linked.",
    });
    router.push("/");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-5 py-12 sm:px-6">
      <header className="mb-10">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-primary-blue/55">
          SME Operations
        </p>
        <h1 className="mt-3 font-serif text-[clamp(1.85rem,4vw,2.5rem)] font-light leading-[1.12] tracking-tight text-primary-blue">
          Sign in to your workspace
        </h1>
        <p className="mt-3 font-sans text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          Pick up where you left off—orders, queues, and updates in one place.
        </p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="signin-email"
            className="mb-2 block font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Business email
          </label>
          <input
            id="signin-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@yourshop.co.za"
            className="w-full border border-primary-blue/15 bg-white px-4 py-3 font-sans text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground/50 focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/20"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="signin-password"
              className="block font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="font-sans text-[11px] font-medium text-primary-blue/70 underline decoration-primary-blue/25 underline-offset-4 hover:text-primary-blue hover:decoration-primary-blue"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="w-full border border-primary-blue/15 bg-white px-4 py-3 font-sans text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground/50 focus-visible:border-primary-blue/35 focus-visible:ring-2 focus-visible:ring-primary-blue/20"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-blue px-6 py-3.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-primary-blue/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-blue disabled:pointer-events-none disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 font-sans text-sm text-muted-foreground">
        New to SME Operations?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary-blue underline decoration-primary-blue/30 underline-offset-4 transition-colors hover:decoration-primary-blue"
        >
          Create an account
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
