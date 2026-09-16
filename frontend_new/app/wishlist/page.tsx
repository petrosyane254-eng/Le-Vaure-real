"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, money } from "@/lib/api";

function WishlistItem({ p, onRemoved }: { p:any; onRemoved:()=>void }) {
  const [detail,setDetail]=useState<any>(null);
  const [variantId,setVariantId]=useState<number|null>(null);
  useEffect(()=>{fetch(`/backend-api/products/${p.slug}/`,{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{setDetail(d);const v=d.variants?.find((x:any)=>x.available)||d.variants?.[0];setVariantId(v?.id||null)}).catch(()=>{})},[p.slug]);
  async function add(){if(!variantId)return;await apiFetch("/cart/add/",{method:"POST",body:JSON.stringify({variantId,quantity:1})});window.dispatchEvent(new Event("lv:cart-changed"))}
  async function remove(){await apiFetch(`/wishlist/toggle/${p.id}/`,{method:"POST",body:"{}"});window.dispatchEvent(new Event("lv:wishlist-changed"));onRemoved()}
  return <article className="wishlist-card">
    <div className="wishlist-photo">{p.image?<img src={p.image} alt={p.name}/>:<div className="product-placeholder">LE VAURÉ</div>}<Heart className="wishlist-heart" size={18} fill="currentColor"/></div>
    <div className="wishlist-info"><h3>{p.name}</h3><strong>{money(p.price)}</strong><div className="color-dots"><i/><i/><i/></div>
      <select value={variantId||""} onChange={e=>setVariantId(Number(e.target.value))}>
        {detail?.variants?.map((v:any)=><option value={v.id} key={v.id} disabled={!v.available}>{v.size?.name || "ONE SIZE"}{v.color?.name?` · ${v.color.name}`:""}</option>)}
        {!detail?.variants?.length&&<option>ONE SIZE</option>}
      </select>
      <button className="wishlist-add" onClick={add} disabled={!variantId}><ShoppingCart size={16}/> Add to Cart</button>
      <button className="wishlist-remove" onClick={remove}><Trash2 size={15}/> Remove</button>
    </div>
  </article>
}

export default function Wishlist(){
  const [items,setItems]=useState<any[]|null>(null);
  const load=()=>fetch("/backend-api/wishlist/",{cache:"no-store",credentials:"include"}).then(async r=>{if(r.status===401){setItems(null);return}const x=await r.json();setItems(x.results||[])}).catch(()=>setItems(null));
  useEffect(()=>{load()},[]);
  if(items===null)return <main className="auth-shell"><div className="auth-card"><h1>MY WISHLIST</h1><p>Sign in to save your favorite pieces.</p><Link className="dark-block-btn" href="/login?next=/wishlist">SIGN IN</Link></div></main>;
  return <main><section className="inner-head"><div className="container"><div className="breadcrumbs">Home &nbsp;›&nbsp; Wishlist</div><div className="title-with-action"><div><h1><Heart size={34}/> MY WISHLIST</h1><p>{items.length} items saved for later</p></div><Link className="outline-cta" href="/shop">CONTINUE SHOPPING <span>→</span></Link></div></div></section>
    <section className="section-tight"><div className="container"><div className="wishlist-grid">{items.map(p=><WishlistItem p={p} key={p.id} onRemoved={load}/>)}</div>{!items.length&&<div className="empty-panel">Your wishlist is empty. <Link href="/shop">Explore the collection →</Link></div>}
      <div className="wishlist-banner" style={{backgroundImage:"url(/home-hero.jpg)"}}><div><h2>STYLE LIVES LONGER</h2><p>Keep what inspires you close.</p></div><span>PEOPLE. PLACES.<br/>A BRIGHTER TOMORROW.</span></div>
    </div></section></main>
}
