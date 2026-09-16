"use client";

import {
  useEffect,
  useState,
} from "react";

import ProductCard
  from "@/components/ProductCard";


export default function Shop() {

  const [
    products,
    setProducts
  ] = useState<any[]>([]);

  const [
    q,
    setQ
  ] = useState("");

  const [
    sort,
    setSort
  ] = useState("new");

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");


  const load = async () => {

    setLoading(true);
    setError("");

    try {

      const params =
        new URLSearchParams({
          q,
          sort,
        });


      const response =
        await fetch(
          `/backend-api/products/?${params.toString()}`,
          {
            cache: "no-store",
          }
        );


      if (!response.ok) {
        throw new Error(
          `API error ${response.status}`
        );
      }


      const data =
        await response.json();


      setProducts(
        data.results || []
      );

    } catch (err) {

      console.error(err);

      setError(
        "Products could not be loaded."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {
    load();
  }, [sort]);


  return (
    <main>

      <div className="page-hero">

        <div className="container">

          <div className="eyebrow">
            LE VAURÉ STORE
          </div>

          <h1>
            SHOP
          </h1>

          <p>
            Premium pieces designed around
            Armenia, people and places.
          </p>

        </div>

      </div>


      <section className="section">

        <div className="container">

          <div className="filters">

            <input
              placeholder="Search products…"
              value={q}
              onChange={(e) =>
                setQ(e.target.value)
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  load();
                }
              }}
            />


            <select
              value={sort}
              onChange={(e) =>
                setSort(
                  e.target.value
                )
              }
            >

              <option value="new">
                Newest
              </option>

              <option value="price_asc">
                Price: low to high
              </option>

              <option value="price_desc">
                Price: high to low
              </option>

              <option value="name">
                Name
              </option>

            </select>


            <button
              className="btn"
              onClick={load}
            >
              SEARCH
            </button>

          </div>


          {loading && (
            <div className="empty">
              Loading products...
            </div>
          )}


          {error && (
            <div className="empty">
              {error}
            </div>
          )}


          {!loading &&
            !error && (
              <div className="grid">

                {products.map(
                  (product) => (

                    <ProductCard
                      key={
                        product.id
                      }
                      p={product}
                    />

                  )
                )}

              </div>
            )}


          {!loading &&
            !error &&
            !products.length && (
              <div className="empty">
                No products found.
              </div>
            )}

        </div>

      </section>

    </main>
  );
}