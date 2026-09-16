"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, money } from "@/lib/api";

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [p, setP] = useState<any>(null);
  const [color, setColor] = useState<any>(null);
  const [variant, setVariant] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setMsg("");
    fetch(`/backend-api/products/${slug}/`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((x) => {
        setP(x);
        setActiveImage(0);
        const first = x.variants?.find((v: any) => v.available) || x.variants?.[0];
        if (first) {
          setColor(first.color);
          setVariant(first);
        }
      })
      .catch(() => setMsg("Could not load this product."));
  }, [slug]);

  const colors = useMemo(() => {
    const map = new Map();
    p?.variants?.forEach((v: any) => {
      if (v?.color?.id != null) map.set(v.color.id, v.color);
    });
    return [...map.values()];
  }, [p]);

  const sizes = useMemo(
    () => p?.variants?.filter((v: any) => color && v.color.id === color.id) || [],
    [p, color]
  );

  const gallery = useMemo(() => {
    if (!p) return [];

    const imgs = [
      ...(Array.isArray(p.gallery) ? p.gallery : []),
      p.image,
      ...(Array.isArray(p.variants)
        ? p.variants.map((v: any) => v?.image).filter(Boolean)
        : []),
    ].filter(Boolean);

    return [...new Set(imgs)] as string[];
  }, [p]);

  useEffect(() => {
    if (!gallery.length) return;
    if (activeImage > gallery.length - 1) setActiveImage(0);
  }, [gallery, activeImage]);

  if (!p) {
    return (
      <main>
        <div className="empty-panel page-loader">{msg || "Loading product…"}</div>
      </main>
    );
  }

  const currentImage = gallery[activeImage] || p.image || "";

  function goPrev() {
    if (gallery.length <= 1) return;
    setActiveImage((i) => (i - 1 + gallery.length) % gallery.length);
  }

  function goNext() {
    if (gallery.length <= 1) return;
    setActiveImage((i) => (i + 1) % gallery.length);
  }

  function showImage(url?: string) {
    if (!url) return;
    const index = gallery.indexOf(url);
    if (index >= 0) setActiveImage(index);
  }

  async function add() {
    if (!variant) return;
    try {
      await apiFetch("/cart/add/", {
        method: "POST",
        body: JSON.stringify({ variantId: variant.id, quantity: qty }),
      });
      window.dispatchEvent(new Event("lv:cart-changed"));
      setMsg("Added to cart.");
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function wish() {
    try {
      await apiFetch(`/wishlist/toggle/${p.id}/`, { method: "POST", body: "{}" });
      window.dispatchEvent(new Event("lv:wishlist-changed"));
      setP({ ...p, wishlisted: !p.wishlisted });
    } catch {
      router.push(`/login?next=/product/${slug}`);
    }
  }

  return (
    <main className="lv-product-v7">
      <div className="container breadcrumbs lv-product-breadcrumbs">
        Home &nbsp;›&nbsp; {p.category?.name || "Shop"} &nbsp;›&nbsp; {p.name}
      </div>

      <section className="lv-product-v7-layout">
        <div className="lv-gallery-v7">
          <div className="lv-gallery-stage-v7">
            {currentImage ? (
              <img src={currentImage} alt={`${p.name} ${activeImage + 1}`} />
            ) : (
              <div className="product-placeholder big">LE VAURÉ</div>
            )}

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  className="lv-gallery-arrow lv-gallery-arrow-left"
                  onClick={goPrev}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={25} strokeWidth={1.45} />
                </button>
                <button
                  type="button"
                  className="lv-gallery-arrow lv-gallery-arrow-right"
                  onClick={goNext}
                  aria-label="Next image"
                >
                  <ChevronRight size={25} strokeWidth={1.45} />
                </button>
              </>
            )}

            {gallery.length > 1 && (
              <div className="lv-gallery-counter-v7">
                {String(activeImage + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
              </div>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="lv-gallery-thumbs-v7" aria-label="Product images">
              {gallery.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  className={i === activeImage ? "active" : ""}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="lv-product-panel-v7">
          <div className="lv-product-panel-inner-v7">
            <span className="lv-product-category-v7">{p.category?.name || "LE VAURÉ"}</span>
            <h1>{p.name}</h1>
            <div className="lv-product-price-v7">{money(variant?.price || p.price)}</div>

            {p.description && <p className="lv-product-description-v7">{p.description}</p>}

            {!!colors.length && (
              <div className="lv-option-v7">
                <div className="lv-option-head-v7">
                  <b>COLOR</b>
                  <span>{color?.name}</span>
                </div>
                <div className="lv-swatches-v7">
                  {colors.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      className={color?.id === c.id ? "active" : ""}
                      title={c.name}
                      onClick={() => {
                        setColor(c);
                        const next =
                          p.variants.find((v: any) => v.color.id === c.id && v.available) ||
                          p.variants.find((v: any) => v.color.id === c.id);
                        setVariant(next);
                        showImage(next?.image);
                      }}
                    >
                      <i style={{ background: c.hex || "#111" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!!sizes.length && (
              <div className="lv-option-v7">
                <div className="lv-option-head-v7">
                  <b>SIZE</b>
                  <a href="#size">SIZE GUIDE</a>
                </div>
                <div className="lv-sizes-v7">
                  {sizes.map((v: any) => (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!v.available}
                      className={variant?.id === v.id ? "active" : ""}
                      onClick={() => {
                        setVariant(v);
                        showImage(v.image);
                      }}
                    >
                      {v.size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="lv-stock-v7">
              {variant
                ? variant.available
                  ? `IN STOCK · ${variant.stock} AVAILABLE`
                  : "SOLD OUT"
                : "SELECT AN OPTION"}
            </div>

            <div className="lv-buy-v7">
              <div className="lv-qty-v7">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">
                  <Minus size={15} />
                </button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} aria-label="Increase quantity">
                  <Plus size={15} />
                </button>
              </div>

              <button className="lv-add-v7" disabled={!variant?.available} onClick={add}>
                <ShoppingBag size={16} />
                ADD TO CART
              </button>

              <button
                type="button"
                className={`lv-wish-v7 ${p.wishlisted ? "active" : ""}`}
                onClick={wish}
                aria-label="Wishlist"
              >
                <Heart size={20} fill={p.wishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            {msg && <p className="lv-product-message-v7">{msg}</p>}

            <div className="lv-product-details-v7">
              <details open>
                <summary>
                  <span>PRODUCT DETAILS</span>
                  <ChevronDown size={16} />
                </summary>
                <p>{p.description}</p>
              </details>
              <details>
                <summary>
                  <span>DELIVERY & RETURNS</span>
                  <ChevronDown size={16} />
                </summary>
                <p>Fast delivery across Armenia. Returns accepted within 14 days according to store policy.</p>
              </details>
              <details id="size">
                <summary>
                  <span>SIZE & CARE</span>
                  <ChevronDown size={16} />
                </summary>
                <p>Choose your regular size for a relaxed fit. Follow the care label for best results.</p>
              </details>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
