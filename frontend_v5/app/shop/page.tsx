"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import styles from "./shop.module.css";

type Product = Record<string, any>;

const text = (v:any) => String(v ?? "").trim();
const norm = (v:any) => text(v).toLowerCase();
const arr = (v:any) => Array.isArray(v) ? v : [];
const productPrice = (p:Product) => Number(p.price ?? p.minPrice ?? p.salePrice ?? p.variants?.[0]?.price ?? 0);
const categoryOf = (p:Product) => text(p.category?.name ?? p.categoryName ?? p.collection?.name ?? p.type ?? "Other");
const colorsOf = (p:Product) => [...new Set(arr(p.variants).map((v:any)=>text(v.color?.name ?? v.color)).filter(Boolean))] as string[];
const sizesOf = (p:Product) => [...new Set(arr(p.variants).map((v:any)=>text(v.size?.name ?? v.size)).filter(Boolean))] as string[];

export default function ShopPage(){
  const [products,setProducts]=useState<Product[]>([]);
  const [loading,setLoading]=useState(true);
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState("featured");
  const [cats,setCats]=useState<string[]>([]);
  const [sizes,setSizes]=useState<string[]>([]);
  const [colors,setColors]=useState<string[]>([]);
  const [maxPrice,setMaxPrice]=useState<number>(0);
  const [filterOpen,setFilterOpen]=useState(false);
  const [hero,setHero]=useState<any>(null);

  useEffect(()=>{
    const q = new URLSearchParams(window.location.search).get("q") || "";
    setQuery(q);
    Promise.all([
      fetch("/backend-api/products/",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()),
      fetch("/backend-api/bootstrap/",{cache:"no-store"}).then(r=>r.ok?r.json():{}).catch(()=>({}))
    ]).then(([d,b]: [any, any])=>{
      const list = Array.isArray(d) ? d : (d.results || d.products || []);
      setProducts(list);
      const allSections = b?.pageSections || b?.page_sections || {};
      const shopSections = Array.isArray(allSections) ? allSections.filter((s:any)=>s.page === "shop") : (allSections?.shop || []);
      const found = shopSections.find((s:any)=>s.key === "hero") || b?.shop || null;
      const campaign = shopSections.find((s:any)=>["campaign","banner","shop_banner"].includes(s.key));
      setHero({...found, campaign});
      setMaxPrice(Math.max(0,...list.map(productPrice)));
    }).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    document.body.style.overflow = filterOpen ? "hidden" : "";
    return ()=>{ document.body.style.overflow = ""; };
  },[filterOpen]);

  const categories=useMemo(()=>[...new Set(products.map(categoryOf).filter(Boolean))].sort(),[products]);
  const allSizes=useMemo(()=>[...new Set(products.flatMap(sizesOf))].sort(),[products]);
  const allColors=useMemo(()=>[...new Set(products.flatMap(colorsOf))].sort(),[products]);
  const ceiling=useMemo(()=>Math.max(0,...products.map(productPrice)),[products]);

  const visible=useMemo(()=>{
    let out=products.filter(p=>{
      const hay=norm([p.name,p.title,p.description,categoryOf(p),...colorsOf(p),...sizesOf(p)].join(" "));
      if(query && !hay.includes(norm(query))) return false;
      if(cats.length && !cats.includes(categoryOf(p))) return false;
      if(sizes.length && !sizes.some(s=>sizesOf(p).includes(s))) return false;
      if(colors.length && !colors.some(c=>colorsOf(p).includes(c))) return false;
      if(maxPrice>0 && productPrice(p)>maxPrice) return false;
      return true;
    });
    if(sort==="price-asc") out=[...out].sort((a,b)=>productPrice(a)-productPrice(b));
    if(sort==="price-desc") out=[...out].sort((a,b)=>productPrice(b)-productPrice(a));
    if(sort==="newest") out=[...out].sort((a,b)=>Number(b.id||0)-Number(a.id||0));
    if(sort==="name") out=[...out].sort((a,b)=>text(a.name||a.title).localeCompare(text(b.name||b.title)));
    return out;
  },[products,query,cats,sizes,colors,maxPrice,sort]);

  const toggle=(value:string,current:string[],set:(v:string[])=>void)=>
    set(current.includes(value)?current.filter(x=>x!==value):[...current,value]);

  const clear=()=>{
    setCats([]); setSizes([]); setColors([]);
    setMaxPrice(ceiling); setQuery("");
  };

  const campaign=hero?.campaign || {};
  const heroImage=hero?.image || hero?.backgroundImage || hero?.background_image || "/home-hero.jpg";
  const heroTitle=hero?.title || "SHOP T-SHIRTS";
  const heroBody=hero?.body || hero?.subtitle || "Premium pieces inspired by Armenia, people and places.";
  const bannerImage=campaign?.image || heroImage;
  const bannerTitle=campaign?.title || "THE LE VAURÉ EDIT";
  const bannerBody=campaign?.body || "A curated selection of signatures, new arrivals and everyday pieces.";
  const bannerEyebrow=campaign?.eyebrow || "LE VAURÉ / 2026";
  const bannerButton=campaign?.buttonLabel || campaign?.button_label || "DISCOVER";
  const bannerUrl=campaign?.buttonUrl || campaign?.button_url || "#shop-products";
  const visualVars=(x:any)=>({
    "--lv-img-x":`${x?.imagePositionX ?? 50}%`, "--lv-img-y":`${x?.imagePositionY ?? 50}%`,
    "--lv-zoom":`${x?.imageZoom ?? 100}%`, "--lv-h":`${x?.desktopHeight ?? x?.minHeight ?? 520}px`,
    "--lv-h-mobile":`${x?.mobileHeight ?? 380}px`, "--lv-w":`${x?.sectionWidth ?? 100}%`,
    "--lv-text-x":`${x?.textPositionX ?? 50}%`, "--lv-text-y":`${x?.textPositionY ?? 50}%`,
    "--lv-content-w":`${x?.contentWidth ?? 560}px`, "--lv-title":`${x?.titleFontSize ?? 48}px`,
    "--lv-title-mobile":`${x?.titleFontSizeMobile ?? 34}px`, "--lv-body":`${x?.bodyFontSize ?? 14}px`,
    "--lv-overlay":String((x?.overlayOpacity ?? 25)/100), "--lv-align":x?.textAlign || "left"
  } as any);
  const activeCount=cats.length+sizes.length+colors.length+((maxPrice>0&&maxPrice<ceiling)?1:0);

  const Filters=()=> <div className={styles.filtersInner}>
    <div className={styles.filterTop}>
      <div><span>REFINE</span><strong>FILTER PRODUCTS</strong></div>
      <button onClick={clear}>CLEAR ALL</button>
    </div>
    {categories.length>0 && <FilterGroup title="CATEGORY">{categories.map(c=>
      <Check key={c} label={c} checked={cats.includes(c)} onClick={()=>toggle(c,cats,setCats)}/>
    )}</FilterGroup>}
    {allSizes.length>0 && <FilterGroup title="SIZE"><div className={styles.sizeGrid}>{allSizes.map(s=>
      <button key={s} className={sizes.includes(s)?styles.selectedSize:""} onClick={()=>toggle(s,sizes,setSizes)}>{s}</button>
    )}</div></FilterGroup>}
    {allColors.length>0 && <FilterGroup title="COLOR">{allColors.map(c=>
      <Check key={c} label={c} checked={colors.includes(c)} onClick={()=>toggle(c,colors,setColors)}/>
    )}</FilterGroup>}
    {ceiling>0 && <FilterGroup title="PRICE">
      <input className={styles.range} type="range" min="0" max={ceiling}
        step={Math.max(1,Math.round(ceiling/100))} value={maxPrice||ceiling}
        onChange={e=>setMaxPrice(Number(e.target.value))}/>
      <div className={styles.rangeLabels}><span>0</span><span>{Math.round(maxPrice||ceiling).toLocaleString()}</span></div>
    </FilterGroup>}
  </div>;

  return <main className={styles.page}>
    <section className={`${styles.intro} ${hero?.image?styles.visualHero:""}`} style={hero?.image?({...visualVars(hero),backgroundImage:`url(${hero.image})`,color:hero?.textColor||"#fff"}):undefined}><div className={styles.visualOverlay}/><div className={styles.introCopy}>
      <div className={styles.breadcrumb}>HOME <span>›</span> SHOP</div>
      <h1>{heroTitle}</h1>
      <p>{heroBody}</p>
      </div>
    </section>

    <section className={styles.catalog}>
      <div className={styles.catalogHead}>
        <div>
          <span className={styles.eyebrow}>LE VAURÉ / SHOP</span>
          <h2>ALL PRODUCTS</h2>
          <p>{visible.length} {visible.length===1?"PRODUCT":"PRODUCTS"}</p>
        </div>

        <div className={styles.toolbar}>
          <button className={styles.filterButton} onClick={()=>setFilterOpen(true)}>
            <SlidersHorizontal size={15}/> FILTER {activeCount>0 && <b>{activeCount}</b>}
          </button>
          <label className={styles.sort}>
            <span>SORT BY</span>
            <select value={sort} onChange={e=>setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
            <ChevronDown size={14}/>
          </label>
        </div>
      </div>

      <div className={styles.categoryBar}>
        <button className={!cats.length?styles.activeCategory:""} onClick={()=>setCats([])}>ALL</button>
        {categories.map(c=><button key={c} className={cats.includes(c)?styles.activeCategory:""} onClick={()=>setCats(cats.includes(c)?[]:[c])}>{c.toUpperCase()}</button>)}
      </div>

      <div className={styles.layout}>
        <aside className={styles.verticalBanner}>
          <div className={`${styles.bannerImage} ${styles.visualBanner}`} style={{...visualVars(campaign),backgroundImage:`url(${bannerImage})`}}>
            <div className={styles.bannerShade}/>
            <div className={styles.bannerCopy}>
              <span>{bannerEyebrow}</span>
              <h3>{bannerTitle}</h3>
              <p>{bannerBody}</p>
              <a href={bannerUrl}>{bannerButton} <span>→</span></a>
            </div>
          </div>
        </aside>

        <div className={styles.products} id="shop-products">
          {loading ? <div className={styles.empty}>Loading products…</div> :
            visible.length ? <div className={styles.grid}>{visible.map(p=><ProductCard key={p.id || p.slug} p={p}/>)}</div> :
            <div className={styles.empty}><strong>NO PRODUCTS FOUND</strong><p>Try changing or clearing the filters.</p><button onClick={clear}>CLEAR FILTERS</button></div>}
        </div>
      </div>
    </section>

    <div className={`${styles.overlay} ${filterOpen?styles.open:""}`} onClick={()=>setFilterOpen(false)}/>
    <aside className={`${styles.drawer} ${filterOpen?styles.open:""}`}>
      <div className={styles.drawerHead}>
        <div><span>LE VAURÉ</span><strong>FILTER & REFINE</strong></div>
        <button onClick={()=>setFilterOpen(false)} aria-label="Close filters"><X size={22}/></button>
      </div>
      <Filters/>
      <button className={styles.showButton} onClick={()=>setFilterOpen(false)}>SHOW {visible.length} PRODUCTS</button>
    </aside>
  </main>;
}

function FilterGroup({title,children}:{title:string;children:any}){
  const [open,setOpen]=useState(true);
  return <div className={styles.group}>
    <button className={styles.groupTitle} onClick={()=>setOpen(!open)}>
      <span>{title}</span><ChevronDown size={15} className={open?styles.chevOpen:""}/>
    </button>
    {open&&<div className={styles.groupBody}>{children}</div>}
  </div>
}

function Check({label,checked,onClick}:{label:string;checked:boolean;onClick:()=>void}){
  return <button className={styles.check} onClick={onClick}>
    <i className={checked?styles.checked:""}/><span>{label}</span>
  </button>
}
