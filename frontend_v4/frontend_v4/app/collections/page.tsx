"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Collection = {
  name: string;
  slug: string;
  subtitle?: string;
  description?: string;
  image?: string;
  featured?: boolean;
};

const fallbackCollections: Collection[] = [
  { name: "ARMENIAN CULTURE", slug: "armenian-culture", subtitle: "ROOTED IN PLACE", image: "/heritage-armenia.jpg", featured: true },
  { name: "TYPOGRAPHY", slug: "typography", subtitle: "WORDS WITH WEIGHT", image: "/home-hero.jpg" },
  { name: "MINIMAL", slug: "minimal", subtitle: "LESS, BETTER", image: "/heritage-armenia.jpg" },
  { name: "STREETWEAR", slug: "streetwear", subtitle: "YEREVAN / EVERYWHERE", image: "/home-hero.jpg" },
];

export default function CollectionsPage() {
  const [rows, setRows] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/backend-api/collections/", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setRows(Array.isArray(data.results) ? data.results : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const collections = useMemo(() => (rows.length ? rows : fallbackCollections), [rows]);
  const lead = collections[0];
  const rest = collections.slice(1, 5);

  return (
    <main className="collections-page-ref">
      <section className="collections-intro-ref">
        <div className="container">
          <div className="eyebrow">DISCOVER LE VAURÉ</div>
          <div className="collections-title-row">
            <h1>COLLECTIONS</h1>
            <p>Stories, symbols and places translated into everyday pieces.</p>
          </div>
        </div>
      </section>

      <section className="container collections-feature-ref">
        <Link
          href={`/collections/${lead.slug}`}
          className="collections-lead-card"
          style={{ backgroundImage: `url(${lead.image || "/home-hero.jpg"})` }}
        >
          <div className="collections-card-shade" />
          <div className="collections-lead-copy">
            <span>{lead.subtitle || "FEATURED COLLECTION"}</span>
            <h2>{lead.name}</h2>
            <div className="collection-shop-link">SHOP COLLECTION <ArrowRight size={15} /></div>
          </div>
        </Link>

        <div className="collections-mini-grid">
          {rest.map((collection, index) => (
            <Link
              href={`/collections/${collection.slug}`}
              className="collections-mini-card"
              key={`${collection.slug}-${index}`}
              style={{ backgroundImage: `url(${collection.image || (index % 2 ? "/heritage-armenia.jpg" : "/home-hero.jpg")})` }}
            >
              <div className="collections-card-shade" />
              <div>
                <span>{collection.subtitle || "LE VAURÉ"}</span>
                <h3>{collection.name}</h3>
                <div className="collection-shop-link">SHOP NOW <ArrowRight size={13} /></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="collections-editorial-ref">
        <div className="collections-editorial-image" style={{ backgroundImage: "url(/heritage-armenia.jpg)" }} />
        <div className="collections-editorial-copy">
          <div className="eyebrow">MADE AROUND MEANING</div>
          <h2>CLOTHING WITH A PURPOSE</h2>
          <p>
            LE VAURÉ collections are built around Armenia, identity, architecture and the details we carry with us.
            Each drop is designed to feel specific, wearable and lasting.
          </p>
          <Link href="/about" className="outline-cta">OUR STORY <ArrowRight size={14} /></Link>
        </div>
      </section>

      <section className="collections-bottom-ref container">
        <div>
          <span>01</span>
          <strong>ROOTED IN ARMENIA</strong>
          <p>Culture and place shape every collection.</p>
        </div>
        <div>
          <span>02</span>
          <strong>LIMITED STORIES</strong>
          <p>Focused drops instead of endless product.</p>
        </div>
        <div>
          <span>03</span>
          <strong>MADE TO STAY</strong>
          <p>Premium essentials designed beyond a season.</p>
        </div>
      </section>

      {!loading && !rows.length && (
        <div className="container admin-hint-ref">
          Showing design placeholders. Add active Collections with images in Django Admin to replace them automatically.
        </div>
      )}
    </main>
  );
}
