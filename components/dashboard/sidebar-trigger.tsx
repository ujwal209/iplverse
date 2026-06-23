"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

export function SidebarTrigger() {
  const pathname = usePathname();


  return (
    <button
      type="button"
      className="lg:hidden p-2 mr-3 bg-slate-50/50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("toggle-sidebar"));
      }}
    >
      <Menu className="h-5 w-5 text-slate-600" />
    </button>
  );
}
