"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, money } from "@/lib/api";

export default function Cart(){
  const [d,setD]=useState<any>({items:[],count:0,total:"0"});
  const load=()=>fetch("/backend-api/cart/",{cache:"no-store",credentials:"include"}).then(r=>r.json()).then(setD);
  useEffect(()=>{load()},[]);
  async function update(id:number,q:number){if(q<1)return;await apiFetch(`/cart/item/${id}/`,{method:"POST",body:JSON.stringify({quantity:q})});await load();window.dispatchEvent(new Event("lv:cart-changed"))}
  async function remove(id:number){await apiFetch(`/cart/item/${id}/`,{method:"DELETE"});await load();window.dispatchEvent(new Event("lv:cart-changed"))}
  return <main><section className="inner-head compact"><div className="container"><div className="breadcrumbs">Home &nbsp;›&nbsp; Cart</div><h1>SHOPPING CART</h1><p>{d.count} items in your cart</p></div></section>
    <section className="section-tight"><div className="container cart-reference-layout"><div className="cart-list">{d.items.map((it:any)=><div className="cart-row" key={it.variantId}><div className="cart-thumb">{(it.variant.image||it.product.image)?<img src={it.variant.image||it.product.image} alt={it.product.name}/>:<div className="product-placeholder">LE VAURÉ</div>}</div><div className="cart-desc"><h3>{it.product.name}</h3><strong>{money(it.variant.price)}</strong><p>Color: {it.variant.color || "—"} &nbsp;&nbsp; Size: {it.variant.size || "—"}</p><div className="qty-control"><button onClick={()=>update(it.variantId,it.quantity-1)}>−</button><span>{it.quantity}</span><button onClick={()=>update(it.variantId,it.quantity+1)}>+</button></div></div><div className="cart-end"><div><Heart size={18}/><button onClick={()=>remove(it.variantId)} aria-label="Remove"><Trash2 size={18}/></button></div><strong>{money(it.lineTotal)}</strong></div></div>)}{!d.items.length&&<div className="empty-panel">Your cart is empty. <Link href="/shop">Continue shopping →</Link></div>}</div>
      <aside className="cart-summary-ref"><div className="promo-code"><input placeholder="Enter promo code"/><button>APPLY</button></div><div className="summary-line"><span>Subtotal ({d.count} items)</span><strong>{money(d.total)}</strong></div><div className="summary-line"><span>Shipping</span><strong>Free</strong></div><div className="summary-line total"><span>Total</span><strong>{money(d.total)}</strong></div>{!!d.items.length&&<Link className="checkout-button" href="/checkout">PROCEED TO CHECKOUT →</Link>}<Link className="continue-link" href="/shop">← CONTINUE SHOPPING</Link></aside>
    </div></section>
    <section className="benefits mini"><div className="container benefits-grid"><div><span>🚚</span><b>FREE DELIVERY</b><small>All over Armenia</small></div><div><span>▣</span><b>SECURE PAYMENT</b><small>Multiple payment options</small></div><div><span>↻</span><b>EASY RETURNS</b><small>Within 14 days</small></div></div></section>
  </main>
}
