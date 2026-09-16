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
      { label: "New arrivals", url: "/shop" },
      { label: "All products", url: "/shop" },
      { label: "Collections", url: "/collections" },
      { label: "Journal", url: "/journal" },
    ],
    footer_help: [
      { label: "Delivery & returns", url: "/about" },
      { label: "Product care", url: "/about" },
      { label: "Contact us", url: "/about#contact" },
      { label: "My account", url: "/account" },
    ],
    footer_company: [
      { label: "The Maison", url: "/about" },
      { label: "Our story", url: "/about" },
      { label: "Terms & conditions", url: "/about" },
      { label: "Privacy", url: "/about" },
    ],
  };

  return (
    <footer className="site-footer maison-footer">
      <div className="container maison-service-intro">
        <span>CLIENT SERVICES</span>
        <h2>How may we assist you?</h2>
        <p>
          Discover delivery, returns, product information and personal
          assistance from LE VAURÉ.
        </p>
        <Link href="/about#contact">CONTACT US</Link>
      </div>

      <div className="container footer-grid maison-footer-grid">
        <div className="footer-brand-block">
          <h3>{d?.settings?.brandName || "LE VAURÉ"}</h3>
          <p>
            {d?.settings?.brandTagline ||
              "CONTEMPORARY CLOTHING, ROOTED IN ARMENIA"}
          </p>
          <div className="footer-social">
            {d?.settings?.instagramUrl && (
              <a
                href={d.settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            )}
            {d?.settings?.facebookUrl && (
              <a
                href={d.settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
            )}
          </div>
        </div>

        {groups.map((group) => (
          <div className="footer-column" key={group}>
            <h4>
              {group === "footer_shop"
                ? d?.settings?.footerShopTitle || "DISCOVER"
                : group === "footer_help"
                  ? d?.settings?.footerHelpTitle || "SERVICES"
                  : d?.settings?.footerCompanyTitle || "ABOUT"}
            </h4>

            {(d?.navigation?.[group]?.length
              ? d.navigation[group]
              : defaults[group]
            ).map((x: any, i: number) => (
              <Link key={i} href={x.url}>
                {x.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="footer-column">
          <h4>{d?.settings?.footerPaymentTitle || "PAYMENT"}</h4>
          <div className="payment-row">
            {(d?.settings?.footerPaymentLabels?.length
              ? d.settings.footerPaymentLabels
              : ["VISA", "MC", "Idram", "Telcell"]
            ).map((x: string) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()}{" "}
          {d?.settings?.footerCopyrightText ||
            "LE VAURÉ. All rights reserved."}
        </span>
        <span>
          {d?.settings?.footerNote || "Designed in Armenia"}
        </span>
      </div>
    </footer>
  );
}
