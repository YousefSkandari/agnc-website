import type { Metadata } from "next";
import PlanForm from "@/components/PlanForm";
import "./plan.css";

export const metadata: Metadata = {
  title: "Get your free 30-day launch plan · agnc. media",
  description: "A few quick questions about your restaurant, then pick a time for us to walk you through your plan.",
};

export default function PlanPage() {
  return <PlanForm />;
}
