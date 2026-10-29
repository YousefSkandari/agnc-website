import type { Metadata } from "next";
import PlanForm from "@/components/form/PlanForm";

// PACKAGE C owns this page. The form's styles load from the root layout (components/form/form.css).
export const metadata: Metadata = {
  title: "Get your free 30-day launch plan · agnc. media",
  description: "A few quick questions about your restaurant, then pick a time for us to walk you through your plan.",
};

export default function PlanPage() {
  return (
    <main id="main">
      <PlanForm mode="page" />
    </main>
  );
}
