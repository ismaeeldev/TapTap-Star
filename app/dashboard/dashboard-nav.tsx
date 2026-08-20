"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Radio,
  MapPin,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/dashboard/devices", label: "Devices", icon: Radio },
  { href: "/dashboard/locations", label: "Locations", icon: MapPin },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// "Clients" only shows for approved agency accounts — /dashboard/clients itself also enforces
// this server-side (never trust this UI toggle alone, per the Step 7 multi-tenant rule).
export function DashboardNav({ showClients = false }: { showClients?: boolean }) {
  const pathname = usePathname();
  const items = showClients
    ? [
        ...NAV_ITEMS.slice(0, 4),
        { href: "/dashboard/clients", label: "Clients", icon: Building2 },
        ...NAV_ITEMS.slice(4),
      ]
    : NAV_ITEMS;

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-body-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-brand-subtle text-brand"
                : "text-text-secondary hover:bg-bg-muted hover:text-text-primary"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
