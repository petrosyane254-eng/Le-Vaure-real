"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import visual from "./visual.module.css";

const vv=(x:any)=>({"--lv-x":`${x?.imagePositionX??50}%`,"--lv-y":`${x?.imagePositionY??50}%`,"--lv-zoom":`${x?.imageZoom??100}%`,"--lv-h":`${x?.desktopHeight??x?.minHeight??0}px`,"--lv-hm":`${x?.mobileHeight??380}px`,"--lv-w":`${x?.sectionWidth??100}%`,"--lv-cw":`${x?.contentWidth??560}px`,"--lv-title":`${x?.titleFontSize??48}px`,"--lv-title-m":`${x?.titleFontSizeMobile??34}px`,"--lv-body":`${x?.bodyFontSize??14}px`,"--lv-align":x?.textAlign||"left"} as any);

export default function About(){
  const[blocks,setBlocks]=useState<any[]>([]); const[sections,setSections]=useState<any[]>([]);
  useEffect(()=>{Promise.all([
    fetch("/backend-api/content/editorials/about/",{cache:"no-store"}).then(r=>r.json()).catch(()=>({results:[]})),
    fetch("/backend-api/bootstrap/",{cache:"no-store"}).then(r=>r.json()).catch(()=>({}))
  ]).then(([e,b])=>{setBlocks(e.results||[]);setSections(b.pageSections?.about||[])})},[]);
  const hero=sections.find(x=>x.key==="hero"); const extras=sections.filter(x=>x.key!=="hero");
  return <main>
    <div className={`page-hero admin-page-hero ${visual.visual}`} style={{...vv(hero),backgroundColor:hero?.backgroundColor,color:hero?.textColor,minHeight:hero?.minHeight||undefined,backgroundImage:hero?.image?`linear-gradient(#0005,#0005),url(${hero.image})`:undefined,backgroundPosition:hero?.imagePosition||undefined}}><div className="container"><div className="eyebrow">{hero?.eyebrow||"ABOUT LE VAURÉ"}</div><h1>{hero?.title||"CLOTHING WITH A PURPOSE"}</h1>{hero?.body&&<p>{hero.body}</p>}</div></div>
    {blocks.map((b:any)=><section className="editorial" key={b.id} style={{background:b.backgroundColor,color:b.textColor}}>{b.imageSide!=="right"&&<div className="editorial-image" style={{backgroundImage:`url(${b.image})`,backgroundPosition:b.imagePosition}}/>}<div className="editorial-copy"><div className="eyebrow">{b.eyebrow}</div><h2>{b.title}</h2><p style={{color:b.mutedTextColor}}>{b.body}</p>{b.buttonUrl&&<Link className="btn secondary" href={b.buttonUrl}>{b.buttonLabel||"DISCOVER"} →</Link>}</div>{b.imageSide==="right"&&<div className="editorial-image" style={{backgroundImage:`url(${b.image})`,backgroundPosition:b.imagePosition}}/>}</section>)}
    {extras.map((x:any)=><section key={x.key} className={`admin-page-section admin-layout-${x.layout} ${visual.visual}`} style={{...vv(x),background:x.backgroundColor,color:x.textColor,minHeight:x.minHeight||undefined}}>{x.image&&<div className="admin-page-section-image" style={{backgroundImage:`url(${x.image})`,backgroundPosition:x.imagePosition}}/>}<div className="container admin-page-section-copy"><div className="eyebrow">{x.eyebrow}</div><h2>{x.title}</h2><p style={{color:x.mutedTextColor}}>{x.body}</p>{x.buttonUrl&&<Link href={x.buttonUrl} className="outline-cta" style={{background:x.buttonBackgroundColor,color:x.buttonTextColor}}>{x.buttonLabel||"DISCOVER"}</Link>}</div></section>)}
  </main>;
}
