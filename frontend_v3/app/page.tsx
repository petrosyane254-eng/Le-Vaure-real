"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, PackageCheck, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";

type HomeData = {
  heroes?: any[];
  promos?: any[];
  editorials?: any[];
  collections?: any[];
  featuredProducts?: any[];
  journal?: any[];
};

const fallbackHero = {
  eyebrow: "NEW SEASON / 2026",
  title: "MADE FOR THE CITY. ROOTED IN ARMENIA.",
  subtitle: "Everyday essentials with a story — designed for movement, culture and the places that shape us.",
  image: "/home-hero.jpg",
  buttonLabel: "SHOP NEW ARRIVALS",
  buttonUrl: "/shop",
};

export default function Home() {
  const [home, setHome] = useState<HomeData>({});
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/backend-api/home/", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setHome)
      .catch(() => {});
    fetch("/backend-api/products/", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setProducts(d.results || []))
      .catch(() => {});
  }, []);

  const hero = home.heroes?.[0] || fallbackHero;
  const featured = (home.featuredProducts?.length ? home.featuredProducts : products).slice(0, 4);
  const secondProducts = (home.featuredProducts?.length ? home.featuredProducts : products).slice(0, 8);
  const promo = home.promos?.[0];
  const editorial = home.editorials?.[0];

  const categories = useMemo(() => {
    if (home.collections?.length) {
      return home.collections.slice(0, 4).map((c: any, i: number) => ({
        title: c.name,
        image: c.image || (i % 2 ? "/heritage-armenia.jpg" : "/home-hero.jpg"),
        href: c.slug ? `/collections/${c.slug}` : "/collections",
      }));
    }
    return [
      { title: "T-SHIRTS", image: "/home-hero.jpg", href: "/shop" },
      { title: "HOODIES", image: "/heritage-armenia.jpg", href: "/shop" },
      { title: "ACCESSORIES", image: "/home-hero.jpg", href: "/shop" },
      { title: "ARMENIAN STORIES", image: "/heritage-armenia.jpg", href: "/collections" },
    ];
  }, [home.collections]);

  return (
    <main className="tnf-home">
      <section className="tnf-hero" style={{ backgroundImage: `url(${hero.image || "/home-hero.jpg"})` }}>
        <div className="tnf-hero-shade" />
        <div className="container tnf-hero-copy">
          <span>{hero.eyebrow || fallbackHero.eyebrow}</span>
          <h1>{hero.title || fallbackHero.title}</h1>
          <p>{hero.subtitle || fallbackHero.subtitle}</p>
          <div className="tnf-hero-actions">
            <Link href={hero.buttonUrl || "/shop"} className="tnf-btn tnf-btn-light">
              {hero.buttonLabel || "SHOP NEW ARRIVALS"}
            </Link>
            <Link href="/collections" className="tnf-btn tnf-btn-light">EXPLORE COLLECTIONS</Link>
          </div>
        </div>
      </section>

      <section className="tnf-category-section">
        <div className="container">
          <div className="tnf-section-head">
            <div><span>DISCOVER</span><h2>SHOP BY CATEGORY</h2></div>
            <Link href="/shop">SHOP ALL <ArrowRight size={15} /></Link>
          </div>
          <div className="tnf-category-grid">
            {categories.map((c, i) => (
              <Link className="tnf-category-card" href={c.href} key={`${c.title}-${i}`}>
                <div className="tnf-category-image" style={{ backgroundImage: `url(${c.image})` }} />
                <div className="tnf-category-copy"><strong>{c.title}</strong><span>SHOP NOW <ArrowRight size={14}/></span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="tnf-product-section">
        <div className="container">
          <div className="tnf-section-head">
            <div><span>LE VAURÉ ESSENTIALS</span><h2>BUILT FOR EVERY DAY</h2></div>
            <Link href="/shop">VIEW ALL <ArrowRight size={15}/></Link>
          </div>
          {featured.length ? (
            <div className="tnf-product-grid">{featured.map((p) => <ProductCard key={p.id} p={p}/>)}</div>
          ) : (
            <div className="tnf-empty">Add products in Django Admin and they will appear here automatically.</div>
          )}
        </div>
      </section>

      <section className="tnf-campaign" style={{ backgroundImage: `url(${promo?.image || "/heritage-armenia.jpg"})` }}>
        <div className="tnf-campaign-shade" />
        <div className="container tnf-campaign-copy">
          <span>{promo?.eyebrow || "LE VAURÉ / ARMENIA"}</span>
          <h2>{promo?.title || "WEAR WHERE YOU COME FROM"}</h2>
          <p>{promo?.subtitle || "A collection inspired by landscapes, architecture and the people who make Armenia feel like home."}</p>
          <Link href={promo?.buttonUrl || "/collections"} className="tnf-btn tnf-btn-light">{promo?.buttonLabel || "DISCOVER THE STORY"}</Link>
        </div>
      </section>

      <section className="tnf-feature-cards">
        <div className="container tnf-feature-grid">
          <article>
            <div className="tnf-feature-image" style={{backgroundImage:"url(/home-hero.jpg)"}} />
            <span>NEW COLLECTION</span><h3>MORE THAN A T-SHIRT</h3><p>Graphic essentials designed to carry a place, a memory and a point of view.</p>
            <Link href="/shop">SHOP THE COLLECTION <ArrowRight size={14}/></Link>
          </article>
          <article>
            <div className="tnf-feature-image" style={{backgroundImage:"url(/heritage-armenia.jpg)"}} />
            <span>OUR WORLD</span><h3>FROM ARMENIA, FOR EVERYWHERE</h3><p>Contemporary clothing shaped by Armenian culture and made for life beyond borders.</p>
            <Link href="/about">OUR STORY <ArrowRight size={14}/></Link>
          </article>
        </div>
      </section>

      {secondProducts.length > 4 && (
        <section className="tnf-product-section tnf-product-section-soft">
          <div className="container">
            <div className="tnf-section-head"><div><span>MORE TO EXPLORE</span><h2>THE LATEST</h2></div><Link href="/shop">SHOP ALL <ArrowRight size={15}/></Link></div>
            <div className="tnf-product-grid">{secondProducts.slice(4,8).map((p) => <ProductCard key={p.id} p={p}/>)}</div>
          </div>
        </section>
      )}

      <section className="tnf-story-split">
        <div className="tnf-story-image" style={{backgroundImage:`url(${editorial?.image || "/home-hero.jpg"})`}} />
        <div className="tnf-story-copy">
          <span>{editorial?.eyebrow || "CLOTHING WITH A PURPOSE"}</span>
          <h2>{editorial?.title || "DESIGNED TO MEAN SOMETHING"}</h2>
          <p>{editorial?.body || "LE VAURÉ brings Armenian identity into a clean, modern wardrobe. Thoughtful graphics, wearable silhouettes and stories that travel with you."}</p>
          <Link href={editorial?.buttonUrl || "/about"}>{editorial?.buttonLabel || "READ OUR STORY"} <ArrowRight size={14}/></Link>
        </div>
      </section>

      <section className="tnf-service-strip">
        <div className="container tnf-service-grid">
          <div><PackageCheck/><strong>FREE DELIVERY</strong><span>Across Armenia on qualifying orders</span></div>
          <div><RotateCcw/><strong>EASY RETURNS</strong><span>Simple returns within 14 days</span></div>
          <div><ShieldCheck/><strong>SECURE CHECKOUT</strong><span>Your information stays protected</span></div>
          <div><Sparkles/><strong>LE VAURÉ QUALITY</strong><span>Made to be worn again and again</span></div>
        </div>
      </section>

      <section className="tnf-newsletter">
        <div className="container tnf-newsletter-inner">
          <div><span>LE VAURÉ COMMUNITY</span><h2>STAY CLOSE TO THE STORY.</h2><p>New drops, campaigns and special releases — straight to your inbox.</p></div>
          <form onSubmit={(e)=>e.preventDefault()}><input type="email" placeholder="Email address" required/><button>JOIN US <ChevronRight size={16}/></button></form>
        </div>
      </section>
    </main>
  );
}
