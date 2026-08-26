"use client";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface TopBarProps {
  breadcrumbs: BreadcrumbItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onMobileMenuToggle: () => void;
}

export default function TopBar({
  breadcrumbs,
  searchQuery,
  onSearchChange,
  onMobileMenuToggle,
}: TopBarProps) {
  return (
    <header
      style={{
        height: 60,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Mobile menu button */}
      <button
        id="mobile-menu-btn"
        onClick={onMobileMenuToggle}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
          display: "flex",
          padding: 6,
          borderRadius: 8,
        }}
        className="md:hidden"
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}
      >
        {breadcrumbs.map((crumb, idx) => (
          <span
            key={idx}
            style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}
          >
            {idx > 0 && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--text-muted)", flexShrink: 0 }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            <button
              onClick={crumb.onClick}
              disabled={!crumb.onClick || idx === breadcrumbs.length - 1}
              style={{
                background: "transparent",
                border: "none",
                cursor: crumb.onClick && idx < breadcrumbs.length - 1 ? "pointer" : "default",
                color:
                  idx === breadcrumbs.length - 1
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                fontSize: 14,
                fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400,
                padding: "2px 4px",
                borderRadius: 4,
                transition: "color 0.15s ease",
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (crumb.onClick && idx < breadcrumbs.length - 1) {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  idx === breadcrumbs.length - 1
                    ? "var(--text-primary)"
                    : "var(--text-muted)";
              }}
            >
              {crumb.label}
            </button>
          </span>
        ))}
      </nav>

      {/* Search */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="gallery-search"
          type="text"
          placeholder="Search products…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "8px 14px 8px 36px",
            color: "var(--text-primary)",
            fontSize: 13,
            width: 220,
            outline: "none",
            transition: "border-color 0.15s ease, width 0.25s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.width = "280px";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.width = "220px";
          }}
          aria-label="Search products"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              padding: 2,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
