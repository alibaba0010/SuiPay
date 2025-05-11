import { useScheduleContext } from "@/contexts/schedule-context";
import {
  ArrowUpRight,
  Calendar,
  CreditCard,
  BarChart4,
  Settings,
  Home,
  Clock,
  FileText,
  Bell,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

export interface NavItem {
  name: string;
  path: string;
  icon: any; // You can make this more specific if needed
  category: string;
  badge: string | null;
}

export function useNavItems(): NavItem[] {
  const { upcomingCount } = useScheduleContext();

  return [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: Home,
      category: "overview",
      badge: null,
    },

    {
      name: "Send Payment",
      path: "/payment-creation",
      icon: ArrowUpRight,
      category: "payments",
      badge: null,
    },
    {
      name: "Send Bulk Payment",
      path: "/send-bulk-payment",
      icon: UsersRound,
      category: "payments",
      badge: null,
    },
    {
      name: "Schedule",
      path: "/schedule-payments",
      icon: Clock,
      category: "payments",
      badge: upcomingCount > 0 ? upcomingCount.toString() : null,
    },
    {
      name: "Payroll",
      path: "/payroll-management",
      icon: Calendar,
      category: "payments",
      badge: null,
    },
    {
      name: "Transactions",
      path: "/transaction-monitoring",
      icon: CreditCard,
      category: "payments",
      badge: null,
    },
    {
      name: "Analytics",
      path: "/analytics-dashboard",
      icon: BarChart4,
      category: "management",
      badge: null,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: FileText,
      category: "management",
      badge: null,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
      category: "management",
      badge: "5",
    },
    {
      name: "Security",
      path: "/security",
      icon: ShieldCheck,
      category: "management",
      badge: null,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      category: "management",
      badge: null,
    },
  ];
}
