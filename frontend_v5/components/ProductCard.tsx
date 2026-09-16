"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { apiFetch, money } from "@/lib/api";
import { useState } from "react";

export default function ProductCard({ p }: { p: any }) {
  const [wished, setWished] = useState(!!p.wishlisted);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    try {
      await apiFetch(`/wishlist/toggle/${p.id}/`, {
        method: "POST",
        body: "{}",
      });
      setWished((v) => !v);
      window.dispatchEvent(new Event("lv:wishlist-changed"));
    } catch {
      window.location.href = `/account?next=/product/${p.slug}`;
    }
  }

  return (
    <Link href={`/product/${p.slug}`} className="product-card maison-product-card">
      <div className="product-image-wrap">
        {p.image ? (
          <img src={p.image} alt={p.name} />
        ) : (
          <div className="product-placeholder">LE VAURÉ</div>
        )}

        <button
          className={`card-heart ${wished ? "active" : ""}`}
          onClick={toggle}
          aria-label="Toggle wishlist"
        >
          <Heart
            size={18}
            fill={wished ? "currentColor" : "none"}
          />
        </button>

        <span className="maison-card-discover">DISCOVER</span>
      </div>

      <div className="product-meta">
        <h3>{p.name}</h3>
        <p>{p.category?.name || "LE VAURÉ"}</p>
        <strong>{money(p.price)}</strong>
      </div>
    </Link>
  );
}
