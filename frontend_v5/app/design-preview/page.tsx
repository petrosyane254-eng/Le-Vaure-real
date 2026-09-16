"use client";

import { useEffect, useRef, useState } from "react";

type Patch = {
  selector: string;
  text?: string;
  src?: string;
  srcset?: string;
  hidden?: boolean;
  styles?: Record<string, string>;
};

type PatchMap = Record<string, Patch[]>;

const PREVIEW_KEY = "levaure-design-preview-v4";

export default function DesignPreviewPage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [path, setPath] = useState("/");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("path") || "/";
    setPath(requested.startsWith("/") ? requested : "/");
  }, []);

  const applyPreview = () => {
    const frame = frameRef.current;
    const doc = frame?.contentDocument;
    const win = frame?.contentWindow;
    if (!frame || !doc || !win) return;

    win.setTimeout(() => {
      let map: PatchMap = {};
      try {
        map = JSON.parse(localStorage.getItem(PREVIEW_KEY) || "{}");
      } catch {}

      const patches = map[path] || [];
      for (const p of patches) {
        if (!p.selector?.trim()) continue;

        let el: HTMLElement | null = null;
        try {
          el = doc.querySelector(p.selector) as HTMLElement | null;
        } catch {
          continue;
        }
        if (!el) continue;

        if (p.text !== undefined) el.textContent = p.text;
        if (p.src !== undefined && el instanceof HTMLImageElement) {
          el.src = p.src;
          el.setAttribute("src", p.src);
          el.srcset = p.srcset ?? p.src;
          el.setAttribute("srcset", p.srcset ?? p.src);
          el.closest("picture")?.querySelectorAll("source").forEach(source => {
            source.setAttribute("srcset", p.srcset ?? p.src!);
          });
        }
        if (p.hidden !== undefined) el.style.display = p.hidden ? "none" : "";
        Object.entries(p.styles || {}).forEach(([key, value]) => {
          el!.style.setProperty(key, value);
        });
      }
    }, 1500);
  };

  const widths = {
    desktop: "100%",
    tablet: "820px",
    mobile: "390px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#e9e9e9", fontFamily: "Arial, sans-serif" }}>
      <header style={{
        height: 58, background: "#111", color: "#fff", display: "flex",
        alignItems: "center", justifyContent: "space-between", padding: "0 18px",
        position: "sticky", top: 0, zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => window.close()}
            style={{ background: "transparent", color: "#fff", border: "1px solid #555", padding: "8px 12px", cursor: "pointer" }}
          >
            ← BACK TO STUDIO
          </button>
          <strong>LE VAURÉ — PREVIEW</strong>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {(["desktop", "tablet", "mobile"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setDevice(item)}
              style={{
                background: device === item ? "#fff" : "transparent",
                color: device === item ? "#111" : "#fff",
                border: "1px solid #555",
                padding: "8px 12px",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, opacity: .7 }}>DRAFT PREVIEW — NOT PUBLISHED</span>
      </header>

      <main style={{ padding: 18, display: "flex", justifyContent: "center" }}>
        <iframe
          ref={frameRef}
          key={`${path}-${device}`}
          src={path}
          onLoad={applyPreview}
          title="LE VAURÉ draft preview"
          style={{
            width: widths[device],
            height: "calc(100vh - 94px)",
            border: "0",
            background: "#fff",
            boxShadow: "0 8px 30px rgba(0,0,0,.12)",
          }}
        />
      </main>
    </div>
  );
}
