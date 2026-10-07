import Seg from "../components/seg";

export type AnalyticsTab = "numbers" | "benchmarks" | "content" | "goals" | "growth" | "reports";

/** The sections of Analytics. Every page in this group shows it at the top right of its header. */
export default function AnalyticsTabs({ active }: { active: AnalyticsTab }) {
  return <Seg label="Analytics sections" value={active} options={[
    { value: "numbers", label: "Numbers", href: "/analytics" },
    { value: "benchmarks", label: "Benchmarks", href: "/analytics/benchmarks" },
    { value: "content", label: "Content", href: "/analytics/content" },
    { value: "goals", label: "Goals", href: "/analytics/goals" },
    { value: "growth", label: "Growth", href: "/analytics/growth" },
    { value: "reports", label: "Reports", href: "/analytics/reports" },
  ]} />;
}
