import ServiceStatistics from "@/components/shadcn-space/blocks/statistics-02/statistics.tsx";
import { Box, ChartColumnIncreasing, Handbag, Star } from "lucide-react";

const demoItems = [
  {
    title: "Orders",
    subtitle: "5868",
    cardIcon: Handbag,
    badgeColor: "bg-teal-400/10",
    statusValue: "+18%",
    caption: "Last 7 days",
  },
  {
    title: "Sales",
    subtitle: "$96,850",
    cardIcon: Box,
    badgeColor: "bg-orange-400/10",
    statusValue: "-5%",
    caption: "Last 7 days",
  },
  {
    title: "Profit",
    subtitle: "$82,906",
    cardIcon: ChartColumnIncreasing,
    badgeColor: "bg-teal-400/10",
    statusValue: "+18%",
    caption: "Last 7 days",
  },
  {
    title: "Expense",
    subtitle: "$14,653",
    cardIcon: Star,
    badgeColor: "bg-teal-400/10",
    statusValue: "+18%",
    caption: "Last 7 days",
  },
];

export default function Statistics02Page() {
  return <ServiceStatistics items={demoItems} />;
}
