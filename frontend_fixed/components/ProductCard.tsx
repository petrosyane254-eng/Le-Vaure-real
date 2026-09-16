import Link from "next/link";import {money} from "@/lib/api";
export default function ProductCard({p}:{p:any}){return <Link href={`/product/${p.slug}`} className="product-card"><div className="product-media">{p.image?<img src={p.image} alt={p.name}/>:null}</div><div className="product-info"><h3>{p.name}</h3><p>{money(p.price)}</p></div></Link>}
