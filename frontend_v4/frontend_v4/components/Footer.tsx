"use client";

import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";
import { useEffect, useState } from "react";

export default function Footer() {
  const [d, setD] = useState<any>(null);
  useEffect(() => {
    fetch("/backend-api/bootstrap/", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => {});
  }, []);

  const groups = ["footer_shop", "footer_help", "footer_company"];
  const defaults: any = {
    footer_shop: [
      { label: "All T-Shirts", url: "/shop" },
      { label: "New Arrivals", url: "/shop" },
      { label: "Collections", url: "/collections" },
      { label: "Special Offers", url: "/shop" },
    ],
    footer_help: [
      { label: "Shipping", url: "/about" },
      { label: "Returns", url: "/about" },
      { label: "Size Guide", url: "/shop" },
      { label: "FAQ", url: "/about" },
    ],
    footer_company: [
      { label: "About Us", url: "/about" },
      { label: "Contact", url: "/about#contact" },
      { label: "Terms & Conditions", url: "/about" },
      { label: "Privacy Policy", url: "/about" },
    ],
  };

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <h3>{d?.settings?.brandName || "LEVAURÉ"}</h3>
          <p>{d?.settings?.brandTagline || "CLOTHING WITH A PURPOSE"}</p>
          <div className="footer-social">
            {d?.settings?.instagramUrl && <a href={d.settings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18}/></a>}
            {d?.settings?.facebookUrl && <a href={d.settings.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={18}/></a>}
          </div>
        </div>
        {groups.map((group) => (
          <div className="footer-column" key={group}>
            <h4>{group === "footer_shop" ? "SHOP" : group === "footer_help" ? "HELP" : "COMPANY"}</h4>
            {(d?.navigation?.[group]?.length ? d.navigation[group] : defaults[group]).map((x: any, i: number) => (
              <Link key={i} href={x.url}>{x.label}</Link>
            ))}
          </div>
        ))}
        <div className="footer-column">
          <h4>WE ACCEPT</h4>
          <div className="payment-row"><span>VISA</span><span>MC</span><span>Idram</span><span>Telcell</span></div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} LE VAURÉ. All rights reserved.</span>
        <span>{d?.settings?.footerNote || "Made with ♥ in Armenia 🇦🇲"}</span>
      </div>
    </footer>
  );
}
