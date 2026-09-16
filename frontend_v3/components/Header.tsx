"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";

type Bootstrap = {
  settings?: any;
  navigation?: Record<string, { label: string; url: string }[]>;
  cartCount?: number;
  wishlistCount?: number;
};

export default function Header() {
  const [data, setData] = useState<Bootstrap>({});
  const [open, setOpen] = useState(false);

  const load = () =>
    fetch("/backend-api/bootstrap/", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((x) => {
        setData(x);
        if (x?.settings?.primaryColor) {
          document.documentElement.style.setProperty("--green", x.settings.primaryColor);
        }
      })
      .catch(() => {});

  useEffect(() => {
    load();
    const fn = () => load();
    window.addEventListener("lv:cart-changed", fn);
    window.addEventListener("lv:wishlist-changed", fn);
    return () => {
      window.removeEventListener("lv:cart-changed", fn);
      window.removeEventListener("lv:wishlist-changed", fn);
    };
  }, []);

  const nav = data.navigation?.header?.length
    ? data.navigation.header
    : [
        { label: "SHOP", url: "/shop" },
        { label: "COLLECTIONS", url: "/collections" },
        { label: "ABOUT", url: "/about" },
        { label: "CONTACT", url: "/about#contact" },
      ];

  return (
    <>
      <div className="announcement">
        <div className="announcement-inner">
          <span>FREE DELIVERY ALL OVER ARMENIA ON ORDERS OVER 12,000 ֏</span>
          <span>HY&nbsp;&nbsp;&nbsp; EN&nbsp;&nbsp;&nbsp; RU</span>
        </div>
      </div>
      <header className="site-header">
        <div className="header-inner container">
          <button className="mobile-menu" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <nav className="header-nav">
            {nav.map((item, index) => (
              <Link key={`${item.url}-${index}`} href={item.url}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link className="brand-lockup" href="/">
            <strong>{data.settings?.brandName || "LE VAURÉ"}</strong>
            <span>T-SHIRTS FOR A BRIGHTER TOMORROW.</span>
          </Link>
          <div className="header-actions">
            <Link href="/shop" aria-label="Search"><Search size={20} /></Link>
            <Link href="/account" aria-label="Account"><User size={20} /></Link>
            <Link href="/wishlist" className="count-link" aria-label="Wishlist">
              <Heart size={20} />
              {!!data.wishlistCount && <i>{data.wishlistCount}</i>}
            </Link>
            <Link href="/cart" className="count-link" aria-label="Cart">
              <ShoppingBag size={20} />
              {!!data.cartCount && <i>{data.cartCount}</i>}
            </Link>
          </div>
        </div>
        {open && (
          <div className="mobile-drawer">
            {nav.map((item, index) => (
              <Link key={`${item.url}-${index}`} href={item.url} onClick={() => setOpen(false)}>
                {item.label}<span>→</span>
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
