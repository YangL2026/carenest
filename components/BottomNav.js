"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, Settings, Users } from "lucide-react";

const tabs = [
  { id: "today", label: "Today", icon: Home, path: "" },
  { id: "calendar", label: "Calendar", icon: Calendar, path: "/calendar" },
  { id: "people", label: "People", icon: Users, path: "/people" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export default function BottomNav({ householdKey }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const href = `/h/${householdKey}${tab.path}`;
          const isActive =
            tab.path === ""
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={href}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 transition-all duration-200 ease-in-out ${
                isActive ? "text-blue-600" : "text-slate-400"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
              <span className={`text-xs ${isActive ? "font-medium" : "font-normal"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
