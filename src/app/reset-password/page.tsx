import type { Metadata } from "next";
import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";
import StickyNavbar from "@/components/landing/sticky-navbar";

export const metadata: Metadata = {
  title: "Reset password | SME Operations",
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <StickyNavbar variant="surface" />
      <ResetPasswordForm />
    </main>
  );
}
