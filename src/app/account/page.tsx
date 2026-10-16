"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import UploadZone from "@/components/admin/UploadZone";
import { saveImageRecord } from "@/lib/api";
import type { ProductImage } from "@/lib/types";

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
}

interface UploadedFile {
  file: File;
  publicUrl: string;
  key: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [savedImages, setSavedImages] = useState<ProductImage[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const user = session?.user as SessionUser | undefined;
  const userId = user?.id ?? user?.email ?? "anonymous";
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileEmail, setProfileEmail] = useState(user?.email ?? "");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (status === "authenticated") {
      const stored = window.localStorage.getItem(`sendiee-images:${userId}`);
      if (stored) {
        // Hydrate the current user's private browser gallery.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSavedImages(JSON.parse(stored) as ProductImage[]);
      }
    }
  }, [status, userId]);

  useEffect(() => {
    if (status === "authenticated") {
      const stored = window.localStorage.getItem(`sendiee-profile:${userId}`);
      if (stored) {
        const profile = JSON.parse(stored) as { name?: string; email?: string };
        // Hydrate editable profile values from this user's private storage.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfileName(profile.name ?? user?.name ?? "");
        setProfileEmail(profile.email ?? user?.email ?? "");
      } else {
        setProfileName(user?.name ?? "");
        setProfileEmail(user?.email ?? "");
      }
    }
  }, [status, userId, user?.email, user?.name]);

  if (status === "loading") {
    return <main style={{ minHeight: "100vh", background: "var(--bg-base)" }} />;
  }

  if (!session || !user) return null;

  const displayName = profileName || profileEmail.split("@")[0] || "Account holder";
  const initials = displayName.slice(0, 2).toUpperCase();

  const saveProfile = () => {
    const profile = { name: profileName.trim(), email: profileEmail.trim() };
    window.localStorage.setItem(`sendiee-profile:${userId}`, JSON.stringify(profile));
    setProfileName(profile.name);
    setProfileEmail(profile.email);
    setEditingProfile(false);
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2200);
  };

  const persistImages = (images: ProductImage[]) => {
    setSavedImages(images);
    window.localStorage.setItem(`sendiee-images:${userId}`, JSON.stringify(images));
  };

  const handleUploadComplete = async (files: UploadedFile[]) => {
    const newImages = await Promise.all(
      files.map((uploaded) =>
        saveImageRecord({
          userId,
          key: uploaded.key,
          publicUrl: uploaded.publicUrl,
          folderId: null,
          productName: uploaded.file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          price: 0,
          sku: "",
          tags: [],
          description: "",
        })
      )
    );
    persistImages([...newImages, ...savedImages]);
    setShowUploader(false);
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <header
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(20px, 5vw, 72px)",
          borderBottom: "1px solid var(--border)",
          background: "rgba(23,25,35,0.86)",
          backdropFilter: "blur(18px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <a href="/account" style={{ color: "var(--text-primary)", textDecoration: "none", fontSize: 18, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          Sendiee <span style={{ color: "var(--accent)" }}>Vision</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }} className="hidden sm:block">
            <div style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user.email}</div>
          </div>
          <div style={{ position: "relative" }}>
            <button
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((open) => !open)}
              style={{ width: 36, height: 36, borderRadius: "50%", border: profileMenuOpen ? "2px solid var(--accent)": "2px solid transparent", display: "grid", placeItems: "center", background: "var(--accent)", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer", padding: 0 }}
            >
              {initials}
            </button>
            {profileMenuOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", width: 240, padding: 8, background: "var(--bg-elevated)", border: "1px solid var(--border-hover)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", zIndex: 20 }}>
                <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profileEmail}</div>
                </div>
                <button
                  onClick={() => { setProfileMenuOpen(false); setEditingProfile(true); }}
                  style={{ width: "100%", padding: "10px 12px", border: 0, borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--text-primary)", textAlign: "left", cursor: "pointer", fontSize: 13 }}
                  onMouseEnter={(event) => { event.currentTarget.style.background = "var(--bg-surface)"; }}
                  onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }}
                >
                  Edit profile
                </button>
              </div>
            )}
          </div>
          <button className="btn-ghost" onClick={() => signOut({ callbackUrl: "/login" })} style={{ padding: "7px 12px", fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(28px, 5vw, 64px) clamp(20px, 5vw, 72px)" }}>
        <section style={{ marginBottom: 36 }}>
          <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Personal workspace</p>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: "clamp(28px, 5vw, 46px)", lineHeight: 1.1, marginBottom: 12 }}>Your image library</h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: 580, fontSize: 15 }}>Upload product images, add their details, and keep your visual catalog organized in one private workspace.</p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
          {[
            ["Images uploaded", String(savedImages.length), "This session"],
            ["Workspace", "Private", "Only visible to you"],
            ["Account ID", userId.slice(0, 14), "Used for data scoping"],
          ].map(([label, value, detail]) => (
            <div key={label} className="stat-card">
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{detail}</div>
            </div>
          ))}
        </section>

        <section className="glass-card" style={{ padding: "clamp(18px, 4vw, 28px)", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: showUploader ? 20 : 0 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 750, marginBottom: 4 }}>Add product images</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>JPG, PNG, or WebP up to 10MB each.</p>
            </div>
            <button className="btn-primary" onClick={() => setShowUploader((visible) => !visible)}>
              {showUploader ? "Close uploader" : "Upload images"}
            </button>
          </div>
          {showUploader && <UploadZone folderId={null} userId={userId} onUploadComplete={handleUploadComplete} />}
        </section>

        {savedImages.length > 0 && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 750 }}>Your uploads</h2>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{savedImages.length} image{savedImages.length === 1 ? "" : "s"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
              {savedImages.map((image) => (
                <article key={image.id} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.thumbnailUrl} alt={image.productName} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", background: "var(--bg-elevated)" }} />
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 650, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{image.productName}</div>
                    <div style={{ color: "var(--accent)", fontWeight: 700, marginTop: 4 }}>₹{image.price.toLocaleString("en-IN")}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {editingProfile && (
        <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && setEditingProfile(false)} role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
          <div className="modal-panel" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 id="profile-modal-title" style={{ fontSize: 18, fontWeight: 750 }}>Edit profile</h2>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>Update your workspace details.</p>
              </div>
              <button className="btn-ghost" onClick={() => setEditingProfile(false)} aria-label="Close profile editor">Close</button>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label htmlFor="profile-name" style={{ display: "block", color: "var(--text-secondary)", fontSize: 13, marginBottom: 6 }}>Full name</label>
                <input id="profile-name" className="input-base" value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Your name" autoComplete="name" />
              </div>
              <div>
                <label htmlFor="profile-email" style={{ display: "block", color: "var(--text-secondary)", fontSize: 13, marginBottom: 6 }}>Email address</label>
                <input id="profile-email" className="input-base" type="email" value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button className="btn-ghost" onClick={() => { setProfileName(user.name ?? ""); setProfileEmail(user.email ?? ""); setEditingProfile(false); }}>Cancel</button>
                <button className="btn-primary" onClick={saveProfile} disabled={!profileEmail.trim()}>Save profile</button>
              </div>
              {profileSaved && <p style={{ color: "var(--success)", fontSize: 13 }}>Profile saved.</p>}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
