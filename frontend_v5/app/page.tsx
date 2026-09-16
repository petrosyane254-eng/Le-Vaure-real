"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Headphones, PackageCheck, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";

type HomeData = {
  heroes?: any[];
  promos?: any[];
  editorials?: any[];
  collections?: any[];
  featuredProducts?: any[];
  journal?: any[];
  sections?: Record<string, any>;
  benefits?: any[];
};

const fallbackHero = {
  eyebrow: "NEW SEASON / 2026",
  title: "MADE FOR THE CITY. ROOTED IN ARMENIA.",
  subtitle: "Everyday essentials with a story — designed for movement, culture and the places that shape us.",
  image: "/home-hero.jpg",
  buttonLabel: "SHOP NEW ARRIVALS",
  buttonUrl: "/shop",
  secondaryButtonLabel: "EXPLORE COLLECTIONS",
  secondaryButtonUrl: "/collections",
  textColor: "#FFFFFF",
  buttonBackgroundColor: "#FFFFFF",
  buttonTextColor: "#111111",
  overlayColor: "#000000",
  overlayOpacity: 38,
  backgroundPosition: "center center",
  desktopHeight: 700,
  mobileHeight: 650,
};

const sectionFallbacks: Record<string, any> = {
  home_categories: { eyebrow: "DISCOVER", title: "SHOP BY CATEGORY", buttonLabel: "SHOP ALL", buttonUrl: "/shop", backgroundColor: "#FFFFFF", textColor: "#111111", active: true },
  home_featured: { eyebrow: "LE VAURÉ ESSENTIALS", title: "BUILT FOR EVERY DAY", buttonLabel: "VIEW ALL", buttonUrl: "/shop", backgroundColor: "#FFFFFF", textColor: "#111111", active: true },
  home_feature_cards: { eyebrow: "DISCOVER", title: "FEATURED STORIES", backgroundColor: "#FFFFFF", textColor: "#111111", active: true },
  home_latest: { eyebrow: "MORE TO EXPLORE", title: "THE LATEST", buttonLabel: "SHOP ALL", buttonUrl: "/shop", backgroundColor: "#F5F5F2", textColor: "#111111", active: true },
  home_story: { eyebrow: "CLOTHING WITH A PURPOSE", title: "DESIGNED TO MEAN SOMETHING", body: "LE VAURÉ brings Armenian identity into a clean, modern wardrobe.", buttonLabel: "READ OUR STORY", buttonUrl: "/about", backgroundColor: "#111111", textColor: "#FFFFFF", active: true },
  home_services: { backgroundColor: "#FFFFFF", textColor: "#111111", active: true },
  home_newsletter: { eyebrow: "LE VAURÉ COMMUNITY", title: "STAY CLOSE TO THE STORY.", body: "New drops, campaigns and special releases — straight to your inbox.", buttonLabel: "JOIN US", backgroundColor: "#F5F5F2", textColor: "#111111", active: true },
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

  const sec = (key: string) => home.sections?.[key] ?? sectionFallbacks[key];
  const visible = (key: string) => sec(key)?.active !== false;
  const hero = home.heroes?.[0] || fallbackHero;
  const featured = (home.featuredProducts?.length ? home.featuredProducts : products).slice(0, 4);
  const secondProducts = (home.featuredProducts?.length ? home.featuredProducts : products).slice(0, 8);
  const promo = home.promos?.find((p: any) => p.placement === "home_mid") || home.promos?.[0];
  const story = home.editorials?.[0];
  const featureOne = home.editorials?.[1];
  const featureTwo = home.editorials?.[2];

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

  const benefits = home.benefits?.length ? home.benefits : [
    { icon: "delivery", title: "FREE DELIVERY", text: "Across Armenia on qualifying orders" },
    { icon: "returns", title: "EASY RETURNS", text: "Simple returns within 14 days" },
    { icon: "secure", title: "SECURE CHECKOUT", text: "Your information stays protected" },
    { icon: "quality", title: "LE VAURÉ QUALITY", text: "Made to be worn again and again" },
  ];
  const benefitIcon = (name: string) => name === "returns" ? <RotateCcw/> : name === "secure" ? <ShieldCheck/> : name === "quality" ? <Sparkles/> : name === "support" ? <Headphones/> : <PackageCheck/>;

  return (
    <main className="tnf-home">
      <section
        className={`tnf-hero tnf-align-${hero.textPosition || "left"}`}
        style={{
          backgroundImage: `url(${hero.image || "/home-hero.jpg"})`,
          backgroundPosition: hero.backgroundPosition || "center center",
          color: hero.textColor || "#fff",
          "--hero-desktop": `${hero.desktopHeight || 700}px`,
          "--hero-mobile": `${hero.mobileHeight || 650}px`,
        } as any}
      >
        <div className="tnf-hero-shade" style={{ backgroundColor: hero.overlayColor || "#000", opacity: Math.min(80, Number(hero.overlayOpacity ?? 38)) / 100 }} />
        <div className="container tnf-hero-copy">
          <span>{hero.eyebrow || fallbackHero.eyebrow}</span>
          <h1>{hero.title || fallbackHero.title}</h1>
          <p>{hero.subtitle || fallbackHero.subtitle}</p>
          <div className="tnf-hero-actions">
            <Link href={hero.buttonUrl || "/shop"} className="tnf-btn" style={{ background: hero.buttonBackgroundColor || "#fff", color: hero.buttonTextColor || "#111" }}>
              {hero.buttonLabel || "SHOP NEW ARRIVALS"}
            </Link>
            {hero.secondaryButtonLabel && <Link href={hero.secondaryButtonUrl || "/collections"} className="tnf-btn" style={{ background: hero.buttonBackgroundColor || "#fff", color: hero.buttonTextColor || "#111" }}>{hero.secondaryButtonLabel}</Link>}
          </div>
        </div>
      </section>

      {visible("home_categories") && <section className="tnf-category-section" style={{ background: sec("home_categories").backgroundColor, color: sec("home_categories").textColor }}>
        <div className="container">
          <div className="tnf-section-head"><div><span>{sec("home_categories").eyebrow}</span><h2>{sec("home_categories").title}</h2></div><Link href={sec("home_categories").buttonUrl || "/shop"}>{sec("home_categories").buttonLabel || "SHOP ALL"} <ArrowRight size={15} /></Link></div>
          <div className="tnf-category-grid">{categories.map((c, i) => <Link className="tnf-category-card" href={c.href} key={`${c.title}-${i}`}><div className="tnf-category-image" style={{ backgroundImage: `url(${c.image})` }} /><div className="tnf-category-copy"><strong>{c.title}</strong><span>SHOP NOW <ArrowRight size={14}/></span></div></Link>)}</div>
        </div>
      </section>}

      {visible("home_featured") && <section className="tnf-product-section" style={{ background: sec("home_featured").backgroundColor, color: sec("home_featured").textColor }}>
        <div className="container">
          <div className="tnf-section-head"><div><span>{sec("home_featured").eyebrow}</span><h2>{sec("home_featured").title}</h2></div><Link href={sec("home_featured").buttonUrl || "/shop"}>{sec("home_featured").buttonLabel || "VIEW ALL"} <ArrowRight size={15}/></Link></div>
          {featured.length ? <div className="tnf-product-grid">{featured.map((p) => <ProductCard key={p.id} p={p}/>)}</div> : <div className="tnf-empty">Add products in Django Admin and they will appear here automatically.</div>}
        </div>
      </section>}

      {promo && <section className={`tnf-campaign tnf-align-${promo.textPosition || "left"}`} style={{ backgroundImage: `url(${promo.image || "/heritage-armenia.jpg"})`, backgroundPosition: promo.backgroundPosition || "center center", color: promo.textColor || "#fff", "--campaign-desktop": `${promo.desktopHeight || 650}px`, "--campaign-mobile": `${promo.mobileHeight || 560}px` } as any}>
        <div className="tnf-campaign-shade" style={{ backgroundColor: promo.overlayColor || "#000", opacity: Math.min(80, Number(promo.overlayOpacity ?? 38)) / 100 }} />
        <div className="container tnf-campaign-copy"><span>{promo.eyebrow || "LE VAURÉ / ARMENIA"}</span><h2>{promo.title}</h2><p>{promo.subtitle}</p><Link href={promo.buttonUrl || "/collections"} className="tnf-btn" style={{ background: promo.buttonBackgroundColor || "#fff", color: promo.buttonTextColor || "#111" }}>{promo.buttonLabel || "DISCOVER"}</Link></div>
      </section>}

      {visible("home_feature_cards") && <section className="tnf-feature-cards" style={{ background: sec("home_feature_cards").backgroundColor, color: sec("home_feature_cards").textColor }}>
        <div className="container">
          {(sec("home_feature_cards").title || sec("home_feature_cards").eyebrow) && <div className="tnf-section-head"><div><span>{sec("home_feature_cards").eyebrow}</span><h2>{sec("home_feature_cards").title}</h2></div></div>}
          <div className="tnf-feature-grid">
            {[featureOne || { eyebrow: "NEW COLLECTION", title: "MORE THAN A T-SHIRT", body: "Graphic essentials designed to carry a place, a memory and a point of view.", image: "/home-hero.jpg", buttonLabel: "SHOP THE COLLECTION", buttonUrl: "/shop" }, featureTwo || { eyebrow: "OUR WORLD", title: "FROM ARMENIA, FOR EVERYWHERE", body: "Contemporary clothing shaped by Armenian culture and made for life beyond borders.", image: "/heritage-armenia.jpg", buttonLabel: "OUR STORY", buttonUrl: "/about" }].map((e:any, i:number) => <article key={i}><div className="tnf-feature-image" style={{backgroundImage:`url(${e.image})`, backgroundPosition:e.imagePosition || "center center"}} /><span>{e.eyebrow}</span><h3>{e.title}</h3><p>{e.body}</p><Link href={e.buttonUrl || "/about"}>{e.buttonLabel || "EXPLORE"} <ArrowRight size={14}/></Link></article>)}
          </div>
        </div>
      </section>}

      {visible("home_latest") && secondProducts.length > 4 && <section className="tnf-product-section" style={{ background: sec("home_latest").backgroundColor, color: sec("home_latest").textColor }}><div className="container"><div className="tnf-section-head"><div><span>{sec("home_latest").eyebrow}</span><h2>{sec("home_latest").title}</h2></div><Link href={sec("home_latest").buttonUrl || "/shop"}>{sec("home_latest").buttonLabel || "SHOP ALL"} <ArrowRight size={15}/></Link></div><div className="tnf-product-grid">{secondProducts.slice(4,8).map((p) => <ProductCard key={p.id} p={p}/>)}</div></div></section>}

      {visible("home_story") && <section className={`tnf-story-split ${story?.imageSide === "right" ? "tnf-story-image-right" : ""}`} style={{ background: story?.backgroundColor || sec("home_story").backgroundColor, color: story?.textColor || sec("home_story").textColor }}>
        <div className="tnf-story-image" style={{backgroundImage:`url(${story?.image || "/home-hero.jpg"})`, backgroundPosition: story?.imagePosition || "center center"}} />
        <div className="tnf-story-copy"><span>{story?.eyebrow || sec("home_story").eyebrow}</span><h2>{story?.title || sec("home_story").title}</h2><p style={{ color: story?.mutedTextColor || undefined }}>{story?.body || sec("home_story").body}</p><Link href={story?.buttonUrl || sec("home_story").buttonUrl || "/about"}>{story?.buttonLabel || sec("home_story").buttonLabel || "READ OUR STORY"} <ArrowRight size={14}/></Link></div>
      </section>}

      {visible("home_services") && <section className="tnf-service-strip" style={{ background: sec("home_services").backgroundColor, color: sec("home_services").textColor }}><div className="container tnf-service-grid">{benefits.map((b:any) => <div key={b.id || b.title}>{benefitIcon(b.icon)}<strong>{b.title}</strong><span>{b.text}</span></div>)}</div></section>}

      {visible("home_newsletter") && <section className="tnf-newsletter" style={{ background: sec("home_newsletter").backgroundColor, color: sec("home_newsletter").textColor }}><div className="container tnf-newsletter-inner"><div><span>{sec("home_newsletter").eyebrow}</span><h2>{sec("home_newsletter").title}</h2><p>{sec("home_newsletter").body}</p></div><form onSubmit={(e)=>e.preventDefault()}><input type="email" placeholder="Email address" required/><button>{sec("home_newsletter").buttonLabel || "JOIN US"} <ChevronRight size={16}/></button></form></div></section>}
    </main>
  );
}
