import type { Metadata } from "next";
import StickyNavbar from "@/components/landing/sticky-navbar";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password — SME Operations",
  description:
    "Enter your business email to receive a password reset link for your SME Operations workspace.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <StickyNavbar variant="surface" />
      <ForgotPasswordForm />
    </main>
  );
}
