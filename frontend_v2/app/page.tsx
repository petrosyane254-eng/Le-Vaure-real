"use client";

import Link from "next/link";
import { ArrowRight, PackageCheck, RotateCcw, ShieldCheck, Sparkles, Search } from "lucide-react";
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

const fallback: HomeData = {
  heroes: [{ eyebrow: "NEW COLLECTION", title: "MORE THAN A T-SHIRT", subtitle: "WEAR YOUR STORY. ARMENIA. PEOPLE. PLACES.", image: "/home-hero.jpg", buttonLabel: "SHOP NOW", buttonUrl: "/shop" }],
  promos: [], editorials: [], collections: [], featuredProducts: [], journal: []
};

export default function Home() {
  const [home, setHome] = useState<HomeData>(fallback);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/backend-api/home/", { cache: "no-store" }).then(r => r.ok ? r.json() : Promise.reject()).then(setHome).catch(() => {});
    fetch("/backend-api/products/", { cache: "no-store" }).then(r => r.ok ? r.json() : Promise.reject()).then(d => setProducts(d.results || [])).catch(() => {});
  }, []);

  const hero = home.heroes?.[0] || fallback.heroes?.[0];
  const promo = home.promos?.[0];
  const editorial = home.editorials?.[0];
  const shownProducts = (home.featuredProducts?.length ? home.featuredProducts : products).slice(0, 8);
  const collectionFallback = useMemo(() => [
    { name: "ARMENIAN CULTURE", subtitle: "SHOP NOW", image: "/heritage-armenia.jpg", slug: "" },
    { name: "TYPOGRAPHY", subtitle: "SHOP NOW", image: "/home-hero.jpg", slug: "" },
    { name: "MINIMAL", subtitle: "SHOP NOW", image: "/heritage-armenia.jpg", slug: "" },
    { name: "STREETWEAR", subtitle: "SHOP NOW", image: "/home-hero.jpg", slug: "" },
  ], []);
  const collections = home.collections?.length ? home.collections.slice(0,4) : collectionFallback;

  return <main>
    <section className="home-hero" style={{ backgroundImage: `url(${hero?.image || "/home-hero.jpg"})` }}>
      <div className="hero-overlay" />
      <div className="container hero-copy">
        <span>{hero?.eyebrow || "NEW COLLECTION"}</span>
        <h1>{hero?.title || "MORE THAN A T-SHIRT"}</h1>
        <p>{hero?.subtitle || "WEAR YOUR STORY. ARMENIA. PEOPLE. PLACES."}</p>
        <Link href={hero?.buttonUrl || "/shop"} className="light-cta">{hero?.buttonLabel || "SHOP NOW"}<ArrowRight size={16}/></Link>
        <div className="hero-pagination"><b>01</b><i/><span>03</span></div>
      </div>
    </section>

    <section className="home-products section-tight">
      <div className="container">
        <div className="section-row"><h2>SHOP T-SHIRTS</h2><Link href="/shop">VIEW ALL <ArrowRight size={15}/></Link></div>
        <div className="catalog-layout">
          <aside className="filter-sidebar">
            <h3>CATEGORY</h3>
            {["All T-Shirts", "Armenian Culture", "Typography", "Minimal", "Streetwear", "Nature"].map((x,i)=><label key={x}><input type="checkbox" defaultChecked={i===0}/><span>{x}</span></label>)}
            <h3>SIZE</h3><div className="size-filter">{["S","M","L","XL","XXL"].map(x=><button key={x}>{x}</button>)}</div>
            <h3>COLOR</h3><div className="filter-colors"><i/><i/><i/><i/><i/><i/></div>
            <h3>PRICE</h3><input className="range" type="range" min="0" max="100" defaultValue="80"/><div className="price-range"><span>0 ֏</span><span>30,000 ֏</span></div>
            <Link className="dark-block-btn" href="/shop">CLEAR FILTERS</Link>
          </aside>
          <div className="catalog-main">
            <div className="catalog-search"><Search size={17}/><input placeholder="Search products..."/></div>
            {shownProducts.length ? <div className="product-grid">{shownProducts.map(p=><ProductCard key={p.id} p={p}/>)}</div> : <div className="empty-panel">Add products in Django Admin to populate this section.</div>}
            <div className="center-link"><Link href="/shop">LOAD MORE PRODUCTS ↓</Link></div>
          </div>
        </div>
      </div>
    </section>

    <section className="promo-split">
      <div className="promo-copy"><span>SPECIAL OFFER</span><h2>{promo?.title || "GET 15% OFF YOUR FIRST ORDER"}</h2><p>{promo?.subtitle || "Use code LEVAURE15 at checkout."}</p><Link className="light-cta" href={promo?.buttonUrl || "/shop"}>{promo?.buttonLabel || "SHOP NOW"}<ArrowRight size={16}/></Link></div>
      <div className="promo-photo" style={{backgroundImage:`url(${promo?.image || "/home-hero.jpg"})`}}/>
    </section>

    <section className="collections-strip section-tight"><div className="container"><div className="section-row"><h2>EXPLORE COLLECTIONS</h2><Link href="/collections">VIEW ALL <ArrowRight size={15}/></Link></div><div className="collection-grid">{collections.map((c:any,i:number)=><Link key={i} className="collection-card" href={c.slug?`/collections/${c.slug}`:"/collections"} style={{backgroundImage:`url(${c.image || "/home-hero.jpg"})`}}><div/><strong>{c.name}</strong><span>{c.subtitle || "SHOP NOW"} →</span></Link>)}</div></div></section>

    <section className="about-split"><div className="about-photo" style={{backgroundImage:`url(${editorial?.image || "/home-hero.jpg"})`}}/><div className="about-copy"><span>ABOUT LEVAURÉ</span><h2>{editorial?.title || "CLOTHING WITH A PURPOSE"}</h2><p>{editorial?.body || "Levauré is an Armenian-based clothing brand creating high-quality printed T-shirts inspired by our culture, people and the places we love. We believe in meaningful design, local production and a brighter tomorrow."}</p><Link className="outline-cta" href={editorial?.buttonUrl || "/about"}>{editorial?.buttonLabel || "OUR STORY"}<ArrowRight size={16}/></Link></div></section>

    <section className="benefits"><div className="container benefits-grid"><div><PackageCheck/><b>FAST DELIVERY</b><span>All over Armenia</span></div><div><ShieldCheck/><b>SECURE PAYMENT</b><span>Multiple payment options</span></div><div><RotateCcw/><b>EASY RETURNS</b><span>Within 14 days</span></div><div><Sparkles/><b>HIGH QUALITY</b><span>Premium cotton</span></div></div></section>

    <section className="reviews section-tight"><div className="container"><div className="section-row"><h2>HAPPY CLIENTS</h2><span>← &nbsp; →</span></div><div className="review-grid">{[
      ["Amazing quality and beautiful designs! Delivery was super fast. Highly recommend Levauré!","Ani S.","Yerevan"],
      ["Finally an Armenian brand that feels modern and authentic. Will definitely order again!","Tigran M.","Gyumri"],
      ["The T-shirt fits perfectly and the print quality is excellent. Love supporting local brands!","Lilit K.","Vanadzor"],
    ].map((r,i)=><article key={i}><div className="quote">“</div><p>{r[0]}</p><div className="stars">★★★★★</div><strong>{r[1]}</strong><span>{r[2]}</span></article>)}</div></div></section>

    <section className="social-strip section-tight"><div className="container"><div className="section-row"><h2>FOLLOW US @LEVAURE</h2><span>SEE MORE →</span></div><div className="social-grid">{["/home-hero.jpg","/heritage-armenia.jpg","/home-hero.jpg","/heritage-armenia.jpg","/home-hero.jpg","/heritage-armenia.jpg"].map((src,i)=><div key={i}><img src={src} alt="LE VAURÉ"/></div>)}</div></div></section>

    <section className="newsletter"><div className="container newsletter-inner"><div><h2>JOIN OUR COMMUNITY</h2><p>Subscribe to get special offers, new collections and more.</p></div><form onSubmit={e=>e.preventDefault()}><input type="email" placeholder="Your email address"/><button>SUBSCRIBE <ArrowRight size={15}/></button></form></div></section>
  </main>;
}
