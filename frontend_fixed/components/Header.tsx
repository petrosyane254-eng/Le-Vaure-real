"use client";
import Link from "next/link";
import { Heart, Search, ShoppingBag, User, Menu } from "lucide-react";
import { useEffect, useState } from "react";

type Bootstrap={settings:any;navigation:Record<string,{label:string;url:string}[]>;cartCount:number;wishlistCount:number;user:any};
export default function Header(){
 const [data,setData]=useState<Bootstrap|null>(null);
 const load=()=>fetch("/backend-api/bootstrap/",{cache:"no-store",credentials:"include"}).then(r=>r.json()).then((x)=>{setData(x); if(x?.settings?.primaryColor) document.documentElement.style.setProperty("--green",x.settings.primaryColor); if(x?.settings?.accentColor) document.documentElement.style.setProperty("--accent",x.settings.accentColor);}).catch(()=>{});
 useEffect(()=>{load(); const fn=()=>load(); window.addEventListener("lv:cart-changed",fn); window.addEventListener("lv:wishlist-changed",fn); return()=>{window.removeEventListener("lv:cart-changed",fn);window.removeEventListener("lv:wishlist-changed",fn)}},[]);
 const nav=data?.navigation?.header?.length?data.navigation.header:[{label:"SHOP",url:"/shop"},{label:"COLLECTIONS",url:"/collections"},{label:"ABOUT",url:"/about"},{label:"JOURNAL",url:"/journal"}];
 return <>
  <div className="announcement">{data?.settings?.announcement||"FREE DELIVERY ALL OVER ARMENIA ON ORDERS OVER 12,000 Ö"}</div>
  <header className="header"><div className="container nav">
   <div className="nav-left">{nav.map((x,i)=><Link key={i} href={x.url}>{x.label}</Link>)}</div>
   <div className="mobile-menu"><Menu size={20}/></div>
   <Link className="logo" href="/">{data?.settings?.brandName||"LE VAURÃ‰"}</Link>
   <div className="nav-right">
    <Link className="icon-link" href="/shop"><Search size={19}/></Link>
    <Link className="icon-link" href="/account"><User size={19}/></Link>
    <Link className="icon-link" href="/wishlist"><Heart size={19}/>{!!data?.wishlistCount&&<span className="count">{data.wishlistCount}</span>}</Link>
    <Link className="icon-link" href="/cart"><ShoppingBag size={19}/>{!!data?.cartCount&&<span className="count">{data.cartCount}</span>}</Link>
   </div>
  </div></header>
 </>;
}

