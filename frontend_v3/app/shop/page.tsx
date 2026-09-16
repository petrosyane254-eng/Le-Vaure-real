"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";

export default function Shop() {
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("new");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/backend-api/products/", { cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setProducts(d.results || []))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    let x = [...products];
    if (query.trim()) x = x.filter(p => `${p.name} ${p.description || ""} ${p.category?.name || ""}`.toLowerCase().includes(query.toLowerCase()));
    if (category !== "all") x = x.filter(p => p.category?.slug === category);
    if (sort === "price_asc") x.sort((a,b)=>Number(a.price)-Number(b.price));
    if (sort === "price_desc") x.sort((a,b)=>Number(b.price)-Number(a.price));
    if (sort === "name") x.sort((a,b)=>a.name.localeCompare(b.name));
    if (sort === "new") x.sort((a,b)=>b.id-a.id);
    return x;
  }, [products, query, sort, category]);

  return <main>
    <section className="shop-banner"><div className="container"><span>Home &nbsp;›&nbsp; Shop</span><h1>SHOP T-SHIRTS</h1><p>Premium pieces inspired by Armenia, people and places.</p></div></section>
    <section className="section-tight"><div className="container catalog-layout shop-catalog">
      <aside className="filter-sidebar">
        <h3>CATEGORY</h3>
        {[{l:"All T-Shirts",v:"all"},{l:"T-Shirts",v:"t-shirts"},{l:"Hoodies",v:"hoodies"},{l:"Caps",v:"caps"},{l:"Accessories",v:"accessories"}].map(x=><label key={x.v}><input type="radio" name="cat" checked={category===x.v} onChange={()=>setCategory(x.v)}/><span>{x.l}</span></label>)}
        <h3>SIZE</h3><div className="size-filter">{["S","M","L","XL","XXL"].map(x=><button key={x}>{x}</button>)}</div>
        <h3>COLOR</h3><div className="filter-colors"><i/><i/><i/><i/><i/><i/></div>
        <h3>PRICE</h3><input className="range" type="range" min="0" max="100" defaultValue="85"/><div className="price-range"><span>0 ֏</span><span>30,000 ֏</span></div>
        <button className="dark-block-btn" onClick={()=>{setCategory("all");setQuery("");setSort("new")}}>CLEAR FILTERS</button>
      </aside>
      <div className="catalog-main">
        <div className="shop-toolbar"><div className="catalog-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products..."/></div><select value={sort} onChange={e=>setSort(e.target.value)}><option value="new">Newest</option><option value="price_asc">Price: Low–High</option><option value="price_desc">Price: High–Low</option><option value="name">Name</option></select></div>
        {loading ? <div className="empty-panel">Loading collection…</div> : visible.length ? <div className="product-grid">{visible.map(p=><ProductCard key={p.id} p={p}/>)}</div> : <div className="empty-panel">No products found.</div>}
      </div>
    </div></section>
  </main>;
}
