import { Metadata } from "next";
import { DashboardOverview } from "@/app/_components/dashboard/overview";

export const metadata: Metadata = {
  title: "Tableau de bord | GazPoints",
};

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardOverview />;
}