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
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true, tourId: "nav-dashboard" },
  { href: "/dashboard/devices", label: "Devices", icon: Radio, tourId: "nav-devices" },
  { href: "/dashboard/locations", label: "Locations", icon: MapPin, tourId: "nav-locations" },
  { href: "/dashboard/employees", label: "Employees", icon: Users, tourId: "nav-employees" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, tourId: "nav-analytics" },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard, tourId: "nav-billing" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, tourId: "nav-settings" },
];

// "Clients" only shows for approved agency accounts — /dashboard/clients itself also enforces
// this server-side (never trust this UI toggle alone, per the Step 7 multi-tenant rule).
export function DashboardNav({ showClients = false }: { showClients?: boolean }) {
  const pathname = usePathname();
  const items = showClients
    ? [
        ...NAV_ITEMS.slice(0, 4),
        { href: "/dashboard/clients", label: "Clients", icon: Building2, tourId: "nav-clients" },
        ...NAV_ITEMS.slice(4),
      ]
    : NAV_ITEMS;

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
      {items.map(({ href, label, icon: Icon, exact, tourId }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            data-tour={tourId}
            className={cn(
              "relative flex shrink-0 items-center gap-2.5 rounded-md py-2.5 pr-3 pl-3 text-body-sm font-medium whitespace-nowrap transition-all duration-150 lg:pl-4",
              active
                ? "bg-brand-subtle text-brand"
                : "text-text-secondary hover:translate-x-0.5 hover:bg-bg-muted hover:text-text-primary"
            )}
          >
            {/* Active-item accent bar (theme guideline section 4) — vertical rail only, so it
                only renders in the desktop lg:flex-col layout, not the mobile horizontal scroller. */}
            {active && (
              <span className="absolute inset-y-1.5 left-0 hidden w-[3px] rounded-full bg-brand lg:block" />
            )}
            <Icon className={cn("size-4 transition-transform", active && "scale-110")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
