"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  QrCode,
  Inbox,
  CreditCard,
  Building2,
  Radio,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/devices/batch-create", label: "Batch-create devices", icon: QrCode },
  { href: "/admin/agency-requests", label: "Agency requests", icon: Inbox },
  { href: "/admin/billing-settings", label: "Billing settings", icon: CreditCard },
  { href: "/admin/accounts", label: "Accounts", icon: Building2 },
  { href: "/admin/devices", label: "Devices", icon: Radio },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
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
