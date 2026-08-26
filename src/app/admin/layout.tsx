"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import TopBar from "@/components/admin/TopBar";
import { usePathname } from "next/navigation";

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Home", href: "/admin" }];
  if (parts[1] === "gallery") crumbs.push({ label: "Gallery", href: "/admin/gallery" });
  if (parts[1] === "settings") crumbs.push({ label: "Settings", href: "/admin/settings" });
  return crumbs.map((c) => ({ label: c.label }));
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <TopBar
          breadcrumbs={breadcrumbs}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        <main
          style={{ flex: 1, overflowY: "auto", padding: "24px" }}
          id="admin-main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
