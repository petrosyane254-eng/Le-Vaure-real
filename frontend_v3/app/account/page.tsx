"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Heart, MapPin, Package, ShoppingBag, UserRound } from "lucide-react";
import { apiFetch, money } from "@/lib/api";

export default function Account() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    fetch("/backend-api/auth/me/", { cache: "no-store", credentials: "include" })
      .then((r) => r.json())
      .then((user) => {
        setMe(user);
        if (!user.authenticated) return;
        fetch("/backend-api/account/orders/", { cache: "no-store", credentials: "include" })
          .then((r) => r.json()).then((d) => setOrders(d.results || []));
        fetch("/backend-api/account/addresses/", { cache: "no-store", credentials: "include" })
          .then((r) => r.json()).then((d) => setAddresses(d.results || []));
      });
  }, []);

  async function signout() {
    await apiFetch("/auth/logout/", { method: "POST", body: "{}" });
    router.push("/");
    router.refresh();
  }

  if (me && !me.authenticated) {
    return (
      <main className="auth-shell account-auth-ref">
        <div className="auth-card account-signin-ref">
          <UserRound size={30} />
          <div className="eyebrow">MY LE VAURÉ</div>
          <h1>WELCOME BACK</h1>
          <p>Sign in to manage orders, saved addresses and your wishlist.</p>
          <Link className="btn" href="/login?next=/account">SIGN IN <ArrowRight size={14} /></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page-ref">
      <section className="account-head-ref">
        <div className="container">
          <div className="eyebrow">MY LE VAURÉ</div>
          <div className="account-title-ref">
            <div>
              <h1>ACCOUNT</h1>
              <p>{me?.email || "Loading your account…"}</p>
            </div>
            <button onClick={signout} className="account-signout-ref">SIGN OUT <ArrowRight size={13} /></button>
          </div>
        </div>
      </section>

      <section className="container account-dashboard-ref">
        <div className="account-quick-grid">
          <div className="account-quick-card">
            <Package size={24} />
            <div><span>ORDERS</span><strong>{orders.length}</strong></div>
          </div>
          <Link href="/wishlist" className="account-quick-card">
            <Heart size={24} />
            <div><span>WISHLIST</span><strong>VIEW</strong></div>
          </Link>
          <div className="account-quick-card">
            <MapPin size={24} />
            <div><span>ADDRESSES</span><strong>{addresses.length}</strong></div>
          </div>
          <Link href="/cart" className="account-quick-card">
            <ShoppingBag size={24} />
            <div><span>CART</span><strong>OPEN</strong></div>
          </Link>
        </div>

        <div className="account-content-grid-ref">
          <section className="account-panel-ref">
            <div className="account-panel-head-ref">
              <div>
                <div className="eyebrow">PURCHASE HISTORY</div>
                <h2>YOUR ORDERS</h2>
              </div>
              <Link href="/shop">CONTINUE SHOPPING <ArrowRight size={13} /></Link>
            </div>

            {orders.length ? orders.map((order) => (
              <article className="account-order-ref" key={order.id}>
                <div className="account-order-top-ref">
                  <div>
                    <span>ORDER</span>
                    <strong>{order.number}</strong>
                  </div>
                  <div>
                    <span>DATE</span>
                    <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span>STATUS</span>
                    <strong>{order.status}</strong>
                  </div>
                  <div className="account-order-total-ref">
                    <span>TOTAL</span>
                    <strong>{money(order.total)}</strong>
                  </div>
                </div>
                <div className="account-order-items-ref">
                  {(order.items || []).map((item: any, i: number) => (
                    <div key={i}>
                      <span>{item.name} × {item.quantity}</span>
                      <small>{[item.color, item.size].filter(Boolean).join(" / ")}</small>
                    </div>
                  ))}
                </div>
              </article>
            )) : (
              <div className="account-empty-ref">
                <Package size={28} />
                <h3>NO ORDERS YET</h3>
                <p>Your completed orders will appear here.</p>
                <Link href="/shop" className="outline-cta">SHOP THE COLLECTION <ArrowRight size={14} /></Link>
              </div>
            )}
          </section>

          <aside className="account-panel-ref account-address-panel-ref">
            <div className="eyebrow">DELIVERY DETAILS</div>
            <h2>SAVED ADDRESSES</h2>
            {addresses.length ? addresses.map((address) => (
              <div className="address-card-ref" key={address.id}>
                <MapPin size={18} />
                <div>
                  <strong>{address.label || "ADDRESS"}</strong>
                  <p>{address.fullName}<br />{address.street} {address.apartment}<br />{address.city}, {address.region} {address.postalCode}<br />{address.phone}</p>
                </div>
              </div>
            )) : (
              <div className="address-empty-ref">
                <MapPin size={23} />
                <p>No saved address yet. Your checkout details can be stored here.</p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
