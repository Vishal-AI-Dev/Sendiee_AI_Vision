"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const NAV_LINKS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/admin/gallery",
    label: "Gallery",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
            <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            Sendiee
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
            Vision Portal
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border)", margin: "0 16px 12px" }} />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", padding: "8px 12px 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Navigation
        </div>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onMobileClose}
            className={`nav-item ${isActive(link.href) ? "active" : ""}`}
          >
            <span style={{ opacity: isActive(link.href) ? 1 : 0.7 }}>{link.icon}</span>
            {link.label}
            {isActive(link.href) && (
              <span
                style={{
                  marginLeft: "auto",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#A5B4FC",
                }}
              />
            )}
          </Link>
        ))}
      </nav>

      {/* Storage Indicator */}
      <div className="mx-3 mb-3">
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>Storage</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>2.4 / 10 GB</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: "24%" }} />
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366F1, #EC4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 13,
              fontWeight: 700,
              color: "white",
            }}
          >
            {session?.user?.name?.[0]?.toUpperCase() ??
              session?.user?.email?.[0]?.toUpperCase() ??
              "A"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session?.user?.name ?? "Admin"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session?.user?.email ?? ""}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: "var(--sidebar-width)",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          height: "100vh",
          position: "sticky",
          top: 0,
          flexShrink: 0,
          overflowY: "auto",
          zIndex: 10,
        }}
        className="hidden md:flex flex-col"
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 40,
          }}
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "var(--sidebar-width)",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          zIndex: 50,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowY: "auto",
        }}
        className="md:hidden flex flex-col"
      >
        {renderSidebarContent()}
      </aside>
    </>
  );
}
