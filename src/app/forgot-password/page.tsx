import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/app/forgot-password/forgot-password-form";
import StickyNavbar from "@/components/landing/sticky-navbar";

export const metadata: Metadata = {
  title: "Forgot password | SME Operations",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <StickyNavbar variant="surface" />
      <ForgotPasswordForm />
    </main>
  );
}
