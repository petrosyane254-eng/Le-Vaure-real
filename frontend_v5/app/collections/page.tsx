"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import visual from "./visual.module.css";

const vv=(x:any)=>({"--lv-x":`${x?.imagePositionX??50}%`,"--lv-y":`${x?.imagePositionY??50}%`,"--lv-zoom":`${x?.imageZoom??100}%`,"--lv-h":`${x?.desktopHeight??x?.minHeight??0}px`,"--lv-hm":`${x?.mobileHeight??380}px`,"--lv-w":`${x?.sectionWidth??100}%`,"--lv-cw":`${x?.contentWidth??560}px`,"--lv-title":`${x?.titleFontSize??48}px`,"--lv-title-m":`${x?.titleFontSizeMobile??34}px`,"--lv-body":`${x?.bodyFontSize??14}px`,"--lv-align":x?.textAlign||"left"} as any);

type Collection = {name:string;slug:string;subtitle?:string;description?:string;image?:string;featured?:boolean};
const fallbackCollections: Collection[] = [
  { name: "ARMENIAN CULTURE", slug: "armenian-culture", subtitle: "ROOTED IN PLACE", image: "/heritage-armenia.jpg", featured: true },
  { name: "TYPOGRAPHY", slug: "typography", subtitle: "WORDS WITH WEIGHT", image: "/home-hero.jpg" },
  { name: "MINIMAL", slug: "minimal", subtitle: "LESS, BETTER", image: "/heritage-armenia.jpg" },
  { name: "STREETWEAR", slug: "streetwear", subtitle: "YEREVAN / EVERYWHERE", image: "/home-hero.jpg" },
];

export default function CollectionsPage(){
  const[rows,setRows]=useState<Collection[]>([]); const[sections,setSections]=useState<any[]>([]); const[loading,setLoading]=useState(true);
  useEffect(()=>{Promise.all([
    fetch("/backend-api/collections/",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).catch(()=>({results:[]})),
    fetch("/backend-api/bootstrap/",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).catch(()=>({}))
  ]).then(([c,b])=>{setRows(Array.isArray(c.results)?c.results:[]);setSections(b.pageSections?.collections||[])}).finally(()=>setLoading(false))},[]);
  const collections=useMemo(()=>rows.length?rows:fallbackCollections,[rows]); const lead=collections[0]; const rest=collections.slice(1,5);
  const hero=sections.find(x=>x.key==="hero"); const story=sections.find(x=>x.key==="story");
  return <main className="collections-page-ref">
    <section className={`collections-intro-ref admin-collections-hero ${visual.visual}`} style={{...vv(hero),backgroundColor:hero?.backgroundColor,color:hero?.textColor,minHeight:hero?.minHeight||undefined,backgroundImage:hero?.image?`linear-gradient(#0005,#0005),url(${hero.image})`:undefined,backgroundPosition:hero?.imagePosition||undefined}}><div className="container"><div className="eyebrow">{hero?.eyebrow||"DISCOVER LE VAURÉ"}</div><div className="collections-title-row"><h1>{hero?.title||"COLLECTIONS"}</h1><p style={{color:hero?.mutedTextColor}}>{hero?.body||"Stories, symbols and places translated into everyday pieces."}</p></div></div></section>
    <section className="container collections-feature-ref">
      <Link href={`/collections/${lead.slug}`} className="collections-lead-card" style={{backgroundImage:`url(${lead.image||"/home-hero.jpg"})`}}><div className="collections-card-shade"/><div className="collections-lead-copy"><span>{lead.subtitle||"FEATURED COLLECTION"}</span><h2>{lead.name}</h2><div className="collection-shop-link">SHOP COLLECTION <ArrowRight size={15}/></div></div></Link>
      <div className="collections-mini-grid">{rest.map((c,i)=><Link href={`/collections/${c.slug}`} className="collections-mini-card" key={`${c.slug}-${i}`} style={{backgroundImage:`url(${c.image||(i%2?"/heritage-armenia.jpg":"/home-hero.jpg")})`}}><div className="collections-card-shade"/><div><span>{c.subtitle||"LE VAURÉ"}</span><h3>{c.name}</h3><div className="collection-shop-link">SHOP NOW <ArrowRight size={13}/></div></div></Link>)}</div>
    </section>
    <section className={`collections-editorial-ref ${visual.visual}`} style={{...vv(story),background:story?.backgroundColor,color:story?.textColor,minHeight:story?.minHeight||undefined}}>
      <div className="collections-editorial-image" style={{backgroundImage:`url(${story?.image||"/heritage-armenia.jpg"})`,backgroundPosition:story?.imagePosition||"center center"}}/>
      <div className="collections-editorial-copy"><div className="eyebrow">{story?.eyebrow||"MADE AROUND MEANING"}</div><h2>{story?.title||"CLOTHING WITH A PURPOSE"}</h2><p style={{color:story?.mutedTextColor}}>{story?.body||"LE VAURÉ collections are built around Armenia, identity, architecture and the details we carry with us."}</p><Link href={story?.buttonUrl||"/about"} className="outline-cta" style={{background:story?.buttonBackgroundColor,color:story?.buttonTextColor}}>{story?.buttonLabel||"OUR STORY"} <ArrowRight size={14}/></Link></div>
    </section>
    {!loading&&!rows.length&&<div className="container admin-hint-ref">Showing design placeholders. Add active Collections with images in Django Admin to replace them automatically.</div>}
  </main>;
}
