"use client";

import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, money } from "@/lib/api";

export default function Product(){
  const {slug}=useParams<{slug:string}>();
  const router=useRouter();
  const[p,setP]=useState<any>(null);
  const[color,setColor]=useState<any>(null);
  const[variant,setVariant]=useState<any>(null);
  const[main,setMain]=useState("");
  const[qty,setQty]=useState(1);
  const[msg,setMsg]=useState("");

  useEffect(()=>{
    fetch(`/backend-api/products/${slug}/`,{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(x=>{
      setP(x);setMain(x.image||x.gallery?.[0]||"");
      const first=x.variants?.find((v:any)=>v.available)||x.variants?.[0];
      if(first){setColor(first.color);setVariant(first)}
    }).catch(()=>setMsg("Could not load this product."))
  },[slug]);

  const colors=useMemo(()=>{const map=new Map();p?.variants?.forEach((v:any)=>map.set(v.color.id,v.color));return [...map.values()]},[p]);
  const sizes=useMemo(()=>p?.variants?.filter((v:any)=>color&&v.color.id===color.id)||[],[p,color]);
  const gallery=useMemo(()=>{const imgs=[main,...(p?.gallery||[])].filter(Boolean);return [...new Set(imgs)].slice(0,4)},[p,main]);
  if(!p)return <main><div className="empty-panel page-loader">{msg||"Loading product…"}</div></main>;

  async function add(){if(!variant)return;try{await apiFetch("/cart/add/",{method:"POST",body:JSON.stringify({variantId:variant.id,quantity:qty})});window.dispatchEvent(new Event("lv:cart-changed"));setMsg("Added to cart.")}catch(e:any){setMsg(e.message)}}
  async function wish(){try{await apiFetch(`/wishlist/toggle/${p.id}/`,{method:"POST",body:"{}"});window.dispatchEvent(new Event("lv:wishlist-changed"));setP({...p,wishlisted:!p.wishlisted})}catch{router.push(`/login?next=/product/${slug}`)}}

  return <main className="product-reference-page"><div className="container breadcrumbs product-breadcrumbs">Home &nbsp;›&nbsp; {p.category?.name||"Shop"} &nbsp;›&nbsp; {p.name}</div><section className="container product-reference-layout"><div className="product-gallery-ref">{gallery.length?gallery.map((img:any,i:number)=><button key={i} onClick={()=>setMain(img)} className={i===0?"main-shot":""}><img src={img} alt={`${p.name} ${i+1}`}/></button>):<div className="product-placeholder big">LE VAURÉ</div>}</div><aside className="product-info-ref"><span className="product-category">{p.category?.name||"LE VAURÉ"}</span><h1>{p.name}</h1><div className="product-price-ref">{money(variant?.price||p.price)}</div><p className="product-desc-ref">{p.description}</p>
    {!!colors.length&&<div className="option-block"><div className="option-title"><b>COLOR</b><span>{color?.name}</span></div><div className="swatch-row">{colors.map((c:any)=><button key={c.id} className={color?.id===c.id?"active":""} onClick={()=>{setColor(c);const next=p.variants.find((v:any)=>v.color.id===c.id&&v.available)||p.variants.find((v:any)=>v.color.id===c.id);setVariant(next);if(next?.image)setMain(next.image)}}><i style={{background:c.hex||"#111"}}/></button>)}</div></div>}
    {!!sizes.length&&<div className="option-block"><div className="option-title"><b>SIZE</b><a href="#size">SIZE GUIDE</a></div><div className="size-row">{sizes.map((v:any)=><button key={v.id} disabled={!v.available} className={variant?.id===v.id?"active":""} onClick={()=>{setVariant(v);if(v.image)setMain(v.image)}}>{v.size.name}</button>)}</div></div>}
    <div className="stock-line">{variant?variant.available?`IN STOCK · ${variant.stock} AVAILABLE`:"SOLD OUT":"SELECT AN OPTION"}</div><div className="product-buy-row"><div className="qty-control large"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={16}/></button><span>{qty}</span><button onClick={()=>setQty(qty+1)}><Plus size={16}/></button></div><button className="product-add" disabled={!variant?.available} onClick={add}><ShoppingBag size={17}/> ADD TO CART</button><button className={`product-wish ${p.wishlisted?"active":""}`} onClick={wish}><Heart size={19} fill={p.wishlisted?"currentColor":"none"}/></button></div>{msg&&<p className="product-message">{msg}</p>}
    <div className="product-details-list"><details open><summary>PRODUCT DETAILS</summary><p>{p.description}</p></details><details><summary>DELIVERY & RETURNS</summary><p>Fast delivery across Armenia. Returns accepted within 14 days according to store policy.</p></details><details id="size"><summary>SIZE & CARE</summary><p>Choose your regular size for a relaxed fit. Follow the care label for best results.</p></details></div>
  </aside></section></main>
}
