import type { Metadata } from "next";
import { UberDirectDemoClient } from "@/components/demo/uber-direct-demo-client";

export const metadata: Metadata = {
  title: "Uber Direct Demo | SME Operations",
  description: "Local-only Uber Direct frontend preview.",
};

export default function UberDirectDemoPage() {
  return <UberDirectDemoClient />;
}