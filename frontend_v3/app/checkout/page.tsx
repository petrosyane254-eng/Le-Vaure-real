"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, money } from "@/lib/api";

export default function Checkout(){
  const router=useRouter();
  const[cart,setCart]=useState<any>({items:[],total:"0",count:0});
  const[f,setF]=useState<any>({fullName:"",email:"",phone:"",country:"Armenia",region:"Yerevan",city:"Yerevan",street:"",apartment:"",postalCode:""});
  const[error,setError]=useState("");
  useEffect(()=>{fetch("/backend-api/cart/",{cache:"no-store",credentials:"include"}).then(r=>r.json()).then(setCart)},[]);
  async function submit(e:any){e.preventDefault();setError("");try{const d:any=await apiFetch("/checkout/",{method:"POST",body:JSON.stringify(f)});sessionStorage.setItem("last_order",JSON.stringify(d));window.dispatchEvent(new Event("lv:cart-changed"));router.push(`/order-success?id=${d.orderId}&number=${encodeURIComponent(d.orderNumber)}`)}catch(x:any){setError(x.message)}}
  const set=(k:string,v:string)=>setF((p:any)=>({...p,[k]:v}));
  return <main><section className="inner-head compact"><div className="container"><div className="breadcrumbs">Home &nbsp;›&nbsp; Checkout</div><h1>CHECKOUT</h1><p>Complete your order in a few simple steps.</p><div className="checkout-steps"><b>1 <span>Shipping</span></b><i/><span>2 <em>Payment</em></span><i/><span>3 <em>Review</em></span></div></div></section>
    <section className="section-tight"><div className="container checkout-ref-layout"><form className="shipping-card" onSubmit={submit}><h2>Shipping Information</h2>{error&&<p className="error">{error}</p>}<div className="form-grid"><label>First name *<input value={f.fullName.split(" ")[0]||""} onChange={e=>set("fullName",`${e.target.value} ${f.fullName.split(" ").slice(1).join(" ")}`.trim())} required/></label><label>Last name *<input value={f.fullName.split(" ").slice(1).join(" ")} onChange={e=>set("fullName",`${f.fullName.split(" ")[0]||""} ${e.target.value}`.trim())} required/></label><label className="full">Phone number *<input value={f.phone} onChange={e=>set("phone",e.target.value)} required/></label><label className="full">Email address *<input type="email" value={f.email} onChange={e=>set("email",e.target.value)} required/></label><label className="full">Address *<input value={f.street} onChange={e=>set("street",e.target.value)} required/></label><label>City *<input value={f.city} onChange={e=>set("city",e.target.value)} required/></label><label>Region<input value={f.region} onChange={e=>set("region",e.target.value)}/></label><label className="full">Postal code (optional)<input value={f.postalCode} onChange={e=>set("postalCode",e.target.value)}/></label></div><label className="remember"><input type="checkbox"/> Save this information for next time</label><button className="checkout-button">CONTINUE TO PAYMENT →</button></form>
      <aside className="order-summary-card"><div className="section-row"><h2>Order Summary</h2><span>Edit</span></div><p>{cart.count || cart.items.length} items</p>{cart.items.map((it:any)=><div className="order-mini" key={it.variantId}><div>{(it.variant.image||it.product.image)?<img src={it.variant.image||it.product.image} alt={it.product.name}/>:<div className="product-placeholder">LV</div>}</div><p><strong>{it.product.name}</strong><span>{money(it.variant.price)}</span><small>Qty: {it.quantity} &nbsp; Size: {it.variant.size}</small></p></div>)}<div className="summary-line"><span>Subtotal</span><strong>{money(cart.total)}</strong></div><div className="summary-line"><span>Shipping</span><strong>Free</strong></div><div className="summary-line total"><span>Total</span><strong>{money(cart.total)}</strong></div><div className="free-shipping-note">🚚 <div><b>Free delivery on this order!</b><span>Your order qualifies for free shipping across Armenia.</span></div></div></aside>
    </div></section>
  </main>
}
