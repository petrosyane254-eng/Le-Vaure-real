"use client";

import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, money } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

type NavItem = { label: string; url: string };
type Bootstrap = {
  settings?: any;
  navigation?: Record<string, NavItem[]>;
  cartCount?: number;
  wishlistCount?: number;
  user?: any;
};

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<Bootstrap>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState<"AMD" | "EUR" | "USD">("AMD");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [autoPlaceholder, setAutoPlaceholder] = useState("");
  const [searchProducts, setSearchProducts] = useState<any[]>([]);
  const [searchProductsLoading, setSearchProductsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [me, setMe] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const load = () =>
    fetch("/backend-api/bootstrap/", {
      cache: "no-store",
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((x) => {
        setData(x);
        const st = x?.settings || {};
        const vars: Record<string, string | undefined> = {
          "--green": st.primaryColor,
          "--accent": st.accentColor,
          "--page-bg": st.pageBackgroundColor,
          "--soft-bg": st.softBackgroundColor,
          "--text": st.textColor,
          "--muted": st.mutedTextColor,
          "--border": st.borderColor,
          "--announcement-bg": st.announcementBackgroundColor,
          "--announcement-text": st.announcementTextColor,
          "--header-bg": st.headerBackgroundColor,
          "--header-text": st.headerTextColor,
          "--footer-bg": st.footerBackgroundColor,
          "--footer-text": st.footerTextColor,
          "--button-bg": st.buttonBackgroundColor,
          "--button-text": st.buttonTextColor,
          "--button-hover-bg": st.buttonHoverBackgroundColor,
          "--button-hover-text": st.buttonHoverTextColor,
          "--product-card-ratio": st.productCardImageRatio,
          "--product-card-radius":
            st.productCardRadius != null
              ? `${st.productCardRadius}px`
              : undefined,
          "--product-grid-gap":
            st.productGridGap != null
              ? `${st.productGridGap}px`
              : undefined,
        };
        Object.entries(vars).forEach(([key, value]) => {
          if (value) document.documentElement.style.setProperty(key, value);
        });
      })
      .catch(() => {});

  async function loadMe() {
    try {
      const r = await fetch("/backend-api/auth/me/", {
        cache: "no-store",
        credentials: "include",
      });
      setMe(await r.json());
    } catch {
      setMe({ authenticated: false });
    }
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lv_currency");
      if (saved === "AMD" || saved === "EUR" || saved === "USD") setCurrency(saved);
    } catch {}
  }, []);

  function chooseCurrency(next: "AMD" | "EUR" | "USD") {
    setCurrency(next);
    setCurrencyOpen(false);
    try {
      window.localStorage.setItem("lv_currency", next);
    } catch {}
    // Existing price components use the shared money() formatter. Reloading once
    // makes every price on the current storefront update together.
    window.location.reload();
  }

  useEffect(() => {
    load();
    const reload = () => load();
    window.addEventListener("lv:cart-changed", reload);
    window.addEventListener("lv:wishlist-changed", reload);
    return () => {
      window.removeEventListener("lv:cart-changed", reload);
      window.removeEventListener("lv:wishlist-changed", reload);
    };
  }, []);

  useEffect(() => {
    const anyOpen = menuOpen || searchOpen || accountOpen;
    document.body.classList.toggle("maison-lock-scroll", anyOpen);
    return () => document.body.classList.remove("maison-lock-scroll");
  }, [menuOpen, searchOpen, accountOpen]);

  useEffect(() => {
    if (accountOpen) loadMe();
  }, [accountOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 420);
    return () => window.clearTimeout(timer);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen || searchProducts.length) return;
    setSearchProductsLoading(true);
    fetch("/backend-api/products/", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((payload) => setSearchProducts(payload?.results || []))
      .catch(() => setSearchProducts([]))
      .finally(() => setSearchProductsLoading(false));
  }, [searchOpen, searchProducts.length]);

  const liveProductSuggestions = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return [];

    const starts = searchProducts.filter((p) =>
      String(p?.name || "").toLocaleLowerCase().startsWith(q)
    );
    const contains = searchProducts.filter((p) => {
      const name = String(p?.name || "").toLocaleLowerCase();
      const category = String(p?.category?.name || "").toLocaleLowerCase();
      return !name.startsWith(q) && (name.includes(q) || category.includes(q));
    });

    return [...starts, ...contains].slice(0, 6);
  }, [query, searchProducts]);

  useEffect(() => {
    if (!searchOpen || query) {
      setAutoPlaceholder("");
      return;
    }

    const phrases = [
      "Search new arrivals",
      "Search women",
      "Search men",
      "Search bags",
      "Search accessories",
      "Search gifts",
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer: number;

    const tick = () => {
      const phrase = phrases[phraseIndex];

      if (!deleting) {
        charIndex += 1;
        setAutoPlaceholder(phrase.slice(0, charIndex));

        if (charIndex >= phrase.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1300);
          return;
        }
      } else {
        charIndex -= 1;
        setAutoPlaceholder(phrase.slice(0, Math.max(charIndex, 0)));

        if (charIndex <= 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timer = window.setTimeout(tick, 260);
          return;
        }
      }

      timer = window.setTimeout(tick, deleting ? 38 : 72);
    };

    timer = window.setTimeout(tick, 450);
    return () => window.clearTimeout(timer);
  }, [searchOpen, query]);

  // When another page requests the account panel (for example the
  // "Sign in here" link on Create Account), open the drawer on Home
  // and immediately clean the helper query parameter from the URL.
  useEffect(() => {
    if (searchParams.get("account") !== "login") return;
    openAccount();
    router.replace("/", { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setSearchOpen(false);
      setAccountOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const nav = useMemo<NavItem[]>(() => {
    if (data.navigation?.header?.length) return data.navigation.header;
    return [
      { label: "NEW", url: "/shop" },
      { label: "WOMEN", url: "/shop" },
      { label: "MEN", url: "/shop" },
      { label: "COLLECTIONS", url: "/collections" },
      { label: "JOURNAL", url: "/journal" },
      { label: "MAISON", url: "/about" },
    ];
  }, [data.navigation]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setSearchOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    setLoginMessage("");
    setLoginBusy(true);
    try {
      await apiFetch("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      await Promise.all([loadMe(), load()]);
      setLoginPassword("");
      setLoginMessage("Welcome back.");
    } catch (error: any) {
      setLoginError(error?.message || "Could not sign in.");
    } finally {
      setLoginBusy(false);
    }
  }

  async function logout() {
    try {
      await apiFetch("/auth/logout/", { method: "POST" });
      setMe({ authenticated: false });
      await load();
      window.dispatchEvent(new Event("lv:cart-changed"));
      setAccountOpen(false);
    } catch {}
  }

  function openAccount() {
    setMenuOpen(false);
    setSearchOpen(false);
    setLoginError("");
    setLoginMessage("");
    setAccountOpen(true);
  }

  return (
    <>
      <div className="announcement maison-announcement">
        <div className="announcement-inner">
          <span>{data.settings?.announcement || "COMPLIMENTARY DELIVERY & RETURNS"}</span>
          <span>LE VAURÉ · ARMENIA</span>
        </div>
      </div>

      <header className="site-header maison-header">
        <div className="header-inner container maison-header-inner">
          <div className="maison-header-left">
            <button className="maison-icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu size={19} />
              <span>MENU</span>
            </button>
            <button className="maison-icon-button maison-search-trigger" onClick={() => { setMenuOpen(false); setAccountOpen(false); setSearchOpen(true); }} aria-label="Search">
              <Search size={18} />
              <span>SEARCH</span>
            </button>
          </div>

          <Link className="brand-lockup maison-brand" href="/">
            <strong>{data.settings?.brandName || "LE VAURÉ"}</strong>
          </Link>

          <div className="header-actions maison-actions">
            <div className={`maison-currency ${currencyOpen ? "open" : ""}`}>
              <button
                type="button"
                className="maison-currency-trigger"
                onClick={() => setCurrencyOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={currencyOpen}
                aria-label="Change currency"
              >
                <span>{currency === "AMD" ? "֏" : currency === "EUR" ? "€" : "$"}</span>
                <b>{currency}</b>
                <ChevronDown size={13} strokeWidth={1.5} />
              </button>
              <div className="maison-currency-menu" role="menu">
                <button type="button" className={currency === "AMD" ? "active" : ""} onClick={() => chooseCurrency("AMD")}>
                  <span>֏</span><b>AMD</b><small>Հայկական դրամ</small>
                </button>
                <button type="button" className={currency === "EUR" ? "active" : ""} onClick={() => chooseCurrency("EUR")}>
                  <span>€</span><b>EUR</b><small>Euro</small>
                </button>
                <button type="button" className={currency === "USD" ? "active" : ""} onClick={() => chooseCurrency("USD")}>
                  <span>$</span><b>USD</b><small>US Dollar</small>
                </button>
              </div>
            </div>
            <Link href="/about#contact" className="maison-desktop-action" aria-label="Client services">
              <MapPin size={18} />
            </Link>
            <button className="maison-header-account" onClick={openAccount} aria-label="Account">
              <User size={19} />
            </button>
            <Link href="/wishlist" className="count-link" aria-label="Wishlist">
              <Heart size={19} />
              {!!data.wishlistCount && <i>{data.wishlistCount}</i>}
            </Link>
            <Link href="/cart" className="count-link" aria-label="Cart">
              <ShoppingBag size={19} />
              {!!data.cartCount && <i>{data.cartCount}</i>}
            </Link>
          </div>
        </div>

        <nav className="maison-primary-nav">
          <div className="container">
            {nav.map((item, index) => (
              <Link key={`${item.url}-${index}`} href={item.url}>{item.label}</Link>
            ))}
          </div>
        </nav>
      </header>

      <div className={`maison-overlay maison-menu-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />

      <aside className={`maison-drawer maison-menu-drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <div className="maison-menu-scroll">
          <div className="maison-menu-close-row">
            <button className="maison-menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <X size={20} strokeWidth={1.5} />
              <span>CLOSE</span>
            </button>
          </div>

          <nav className="maison-menu-main" aria-label="Main menu">
            {nav.map((item, index) => (
              <Link key={`${item.url}-${index}`} href={item.url} onClick={() => setMenuOpen(false)}>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="maison-menu-secondary">
            <button className="maison-drawer-account-link" onClick={() => { setMenuOpen(false); openAccount(); }}>MY ACCOUNT</button>
            <Link href="/wishlist" onClick={() => setMenuOpen(false)}>WISHLIST</Link>
            <Link href="/about#contact" onClick={() => setMenuOpen(false)}>CLIENT SERVICES</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}>THE MAISON</Link>
          </div>

          <div className="maison-menu-bottom">
            <Link href="/shop" onClick={() => setMenuOpen(false)}>STORE</Link>
            <span>DELIVERY TO: ARMENIA</span>
            <Link href="/about" onClick={() => setMenuOpen(false)}>SUSTAINABILITY</Link>
          </div>
        </div>
      </aside>

      <div
        className={`maison-search-backdrop ${searchOpen ? "open" : ""}`}
        onClick={() => setSearchOpen(false)}
        aria-hidden="true"
      />
      <section className={`maison-search-layer ${searchOpen ? "open" : ""}`} aria-hidden={!searchOpen}>
        <div className="maison-search-shell">
          <div className="maison-search-head">
            <Link href="/" className="maison-search-brand" onClick={() => setSearchOpen(false)}>
              {data.settings?.brandName || "LE VAURÉ"}
            </Link>
            <button className="maison-search-close" onClick={() => setSearchOpen(false)} aria-label="Close search">
              <X size={20} strokeWidth={1.45} />
            </button>
          </div>

          <form className="maison-search-form" onSubmit={submitSearch}>
            <Search size={18} strokeWidth={1.55} />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={autoPlaceholder || "Search LE VAURÉ"}
              autoComplete="off"
              tabIndex={searchOpen ? 0 : -1}
            />
            {query && (
              <button type="button" className="maison-search-clear" onClick={() => { setQuery(""); searchInputRef.current?.focus(); }}>
                CLEAR
              </button>
            )}
          </form>

          {query.trim() && (
            <div className="maison-live-search" aria-live="polite">
              <div className="maison-live-search-label">
                <span>PRODUCT SUGGESTIONS</span>
                {searchProductsLoading && <small>SEARCHING…</small>}
              </div>

              {!searchProductsLoading && liveProductSuggestions.length > 0 && (
                <div className="maison-live-search-list">
                  {liveProductSuggestions.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      className="maison-live-search-item"
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery("");
                      }}
                    >
                      <div className="maison-live-search-image">
                        {product.image ? (
                          <img src={product.image} alt="" />
                        ) : (
                          <span>LV</span>
                        )}
                      </div>
                      <div className="maison-live-search-copy">
                        <strong>{product.name}</strong>
                        <span>{product.category?.name || "LE VAURÉ"}</span>
                      </div>
                      <em>{money(product.price)}</em>
                      <ChevronRight size={16} strokeWidth={1.4} />
                    </Link>
                  ))}
                </div>
              )}

              {!searchProductsLoading && liveProductSuggestions.length === 0 && (
                <div className="maison-live-search-empty">No matching products yet.</div>
              )}

              <button type="button" className="maison-live-search-all" onClick={() => {
                const q = query.trim();
                setSearchOpen(false);
                router.push(`/shop?q=${encodeURIComponent(q)}`);
              }}>
                VIEW ALL RESULTS FOR “{query.trim()}” <ChevronRight size={15} />
              </button>
            </div>
          )}

          {!query.trim() && <div className="maison-search-suggestions">
            <span>POPULAR SEARCHES</span>
            <div>
              <button onClick={() => { setQuery("new arrivals"); searchInputRef.current?.focus(); }}>new arrivals</button>
              <button onClick={() => { setQuery("women"); searchInputRef.current?.focus(); }}>women</button>
              <button onClick={() => { setQuery("men"); searchInputRef.current?.focus(); }}>men</button>
              <button onClick={() => { setQuery("bags"); searchInputRef.current?.focus(); }}>bags</button>
              <button onClick={() => { setQuery("accessories"); searchInputRef.current?.focus(); }}>accessories</button>
              <button onClick={() => { setQuery("gifts"); searchInputRef.current?.focus(); }}>gifts</button>
            </div>
          </div>}

          <div className="maison-search-discover">
            <span>DISCOVER</span>
            <div>
              <Link href="/shop" onClick={() => setSearchOpen(false)}>New arrivals</Link>
              <Link href="/collections" onClick={() => setSearchOpen(false)}>Collections</Link>
              <Link href="/journal" onClick={() => setSearchOpen(false)}>Journal</Link>
            </div>
          </div>
        </div>
      </section>

      <div className={`maison-account-backdrop ${accountOpen ? "open" : ""}`} onClick={() => setAccountOpen(false)} aria-hidden="true" />
      <aside className={`maison-account-drawer ${accountOpen ? "open" : ""}`} aria-hidden={!accountOpen}>
        <div className="maison-account-scroll">
          <div className="maison-account-topbar">
            <h2>{me?.authenticated ? "My account" : "Sign in or continue as guest"}</h2>
            <button onClick={() => setAccountOpen(false)} aria-label="Close account"><X size={20} /></button>
          </div>

          {me?.authenticated ? (
            <div className="maison-account-signed">
              <div className="maison-account-welcome">
                <span>WELCOME</span>
                <h3>{me.firstName || me.first_name || me.email || "LE VAURÉ member"}</h3>
                <p>Access your orders, addresses, wishlist and account preferences.</p>
              </div>
              <div className="maison-account-menu-list">
                <Link href="/account" onClick={() => setAccountOpen(false)}><span>Account overview</span><ChevronRight size={16} /></Link>
                <Link href="/account#orders" onClick={() => setAccountOpen(false)}><span>Orders</span><ChevronRight size={16} /></Link>
                <Link href="/account#addresses" onClick={() => setAccountOpen(false)}><span>Addresses</span><ChevronRight size={16} /></Link>
                <Link href="/wishlist" onClick={() => setAccountOpen(false)}><span>Wishlist</span><ChevronRight size={16} /></Link>
              </div>
              <button className="maison-account-primary" onClick={logout}>SIGN OUT</button>
            </div>
          ) : (
            <>
              <section className="maison-account-login-section">
                <h3>I already have an account</h3>

                <button type="button" className="maison-social-login" onClick={() => setLoginMessage("Google sign-in can be connected when OAuth is enabled.")}>
                  <span className="maison-google-mark">G</span><span>Continue with Google</span>
                </button>
                <button type="button" className="maison-social-login" onClick={() => setLoginMessage("Apple sign-in can be connected when OAuth is enabled.")}>
                  <span className="maison-apple-mark">●</span><span>Continue with Apple</span>
                </button>

                <div className="maison-auth-divider"><span>or</span></div>

                <form onSubmit={submitLogin} className="maison-account-form">
                  <div className="maison-account-required"><span></span><span>Required fields*</span></div>
                  <label>
                    <span>Email address*</span>
                    <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="email" required />
                  </label>
                  <label>
                    <span>Password*</span>
                    <div className="maison-password-field">
                      <input type={showPassword ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password" required />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </label>
                  <Link href="/forgot-password" onClick={() => setAccountOpen(false)} className="maison-forgot-link">Forgot password?</Link>
                  {loginError && <p className="maison-account-error">{loginError}</p>}
                  {loginMessage && <p className="maison-account-message">{loginMessage}</p>}
                  <button className="maison-account-primary" disabled={loginBusy}>{loginBusy ? "SIGNING IN…" : "SIGN IN"}</button>
                </form>
              </section>

              <section className="maison-account-new-section">
                <h3>New customer</h3>
                <p>Create your personal LE VAURÉ account to save favourites, manage addresses and follow your orders.</p>
                <Link href="/account?mode=register" onClick={() => setAccountOpen(false)} className="maison-account-outline">CREATE AN ACCOUNT</Link>
                <Link href="/checkout" onClick={() => setAccountOpen(false)} className="maison-account-guest">CONTINUE AS GUEST</Link>
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
