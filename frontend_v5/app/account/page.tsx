"use client";

import Link from "next/link";
import {
  Suspense,
  FormEvent,
  KeyboardEvent,
  ClipboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { apiFetch, money } from "@/lib/api";

type AuthMode = "login" | "register" | "verify";

const CODE_LENGTH = 6;

export default function Account() {
  return (
    <Suspense fallback={<p role="status">Loading…</p>}>
      <AccountContent />
    </Suspense>
  );
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [me, setMe] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const hero =
  sections.find(
    (section: any) =>
      section?.type === "hero" ||
      section?.sectionType === "hero" ||
      section?.key === "hero"
  ) || sections[0] || null;

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [salutation, setSalutation] = useState("");
  const [phoneCode, setPhoneCode] = useState("+49");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [verificationEmail, setVerificationEmail] = useState("");
  const [code, setCode] = useState<string[]>(
    Array(CODE_LENGTH).fill("")
  );
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    fetch("/backend-api/bootstrap/", {
      cache: "no-store",
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setSections(d.pageSections?.account || []))
      .catch(() => {});

    loadAccount();
  }, []);

  useEffect(() => {
    const mode = searchParams.get("mode");

    // The account page must always open on Log in unless the URL
    // explicitly requests the registration experience. This prevents
    // a stale register state from reopening Create Account by itself.
    setAuthMode(mode === "register" ? "register" : "login");
    clearFeedback();
  }, [searchParams]);

  useEffect(() => {
    // There is no standalone guest login page anymore. If a signed-out
    // visitor reaches /account without registration mode, send them Home
    // and let the global Header open the account drawer.
    if (me && !me.authenticated && authMode === "login") {
      router.replace("/?account=login");
    }
  }, [me, authMode, router]);

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setResendSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  async function loadAccount() {
    try {
      const r = await fetch("/backend-api/auth/me/", {
        cache: "no-store",
        credentials: "include",
      });
      const user = await r.json();

      setMe(user);

      if (!user.authenticated) return;

      const [ordersResponse, addressesResponse] = await Promise.all([
        fetch("/backend-api/account/orders/", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/backend-api/account/addresses/", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const ordersData = await ordersResponse.json();
      const addressesData = await addressesResponse.json();

      setOrders(ordersData.results || []);
      setAddresses(addressesData.results || []);
    } catch {
      setMe({ authenticated: false });
    }
  }

  function clearFeedback() {
    setAuthError("");
    setAuthMessage("");
  }

  function switchAuthMode(mode: "login" | "register") {
    clearFeedback();
    setAuthMode(mode);

    // Keep the URL and the visible auth screen in sync.
    // Login uses the clean /account URL; registration is explicit.
    if (mode === "register") {
      router.replace("/account?mode=register", { scroll: false });
      return;
    }

    // Login is handled globally by the Header drawer. Return to Home and
    // ask the Header to open that panel instead of rendering a login page.
    router.push("/?account=login");
  }

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    clearFeedback();
    setBusy(true);

    try {
      await apiFetch("/auth/login/", {
        method: "POST",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      await loadAccount();
      router.refresh();
    } catch (error: any) {
      setAuthError(error?.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function submitRegister(event: FormEvent) {
    event.preventDefault();
    clearFeedback();

    if (registerEmail.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setAuthError("Email addresses do not match.");
      return;
    }

    if (registerPassword.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);

    try {
      const result = await apiFetch<any>("/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      setVerificationEmail(result?.email || registerEmail);
      setCode(Array(CODE_LENGTH).fill(""));
      setAuthMode("verify");
      setResendSeconds(60);
      setAuthMessage(
        "We sent a 6-digit verification code to your email."
      );

      window.setTimeout(() => {
        codeRefs.current[0]?.focus();
      }, 50);
    } catch (error: any) {
      setAuthError(
        error?.message || "Could not create your account."
      );
    } finally {
      setBusy(false);
    }
  }

  function updateCode(index: number, rawValue: string) {
    const value = rawValue.replace(/\D/g, "").slice(-1);

    setCode((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });

    setAuthError("");

    if (value && index < CODE_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  }

  function codeKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Backspace" &&
      !code[index] &&
      index > 0
    ) {
      codeRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < CODE_LENGTH - 1
    ) {
      codeRefs.current[index + 1]?.focus();
    }
  }

  function pasteCode(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);

    if (!pasted) return;

    event.preventDefault();

    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });

    setCode(next);

    const focusIndex = Math.min(
      pasted.length,
      CODE_LENGTH
    ) - 1;

    window.setTimeout(() => {
      codeRefs.current[Math.max(0, focusIndex)]?.focus();
    }, 0);
  }

  async function submitVerification(event: FormEvent) {
    event.preventDefault();
    clearFeedback();

    const verificationCode = code.join("");

    if (verificationCode.length !== CODE_LENGTH) {
      setAuthError("Enter the complete 6-digit code.");
      return;
    }

    setBusy(true);

    try {
      await apiFetch("/auth/verify-email/", {
        method: "POST",
        body: JSON.stringify({
          code: verificationCode,
        }),
      });

      setAuthMessage("Email verified. Your account is ready.");
      await loadAccount();
      router.refresh();
    } catch (error: any) {
      setAuthError(
        error?.message || "Could not verify this code."
      );
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    if (busy || resendSeconds > 0) return;

    clearFeedback();
    setBusy(true);

    try {
      const result = await apiFetch<any>(
        "/auth/resend-verification/",
        {
          method: "POST",
          body: "{}",
        }
      );

      setCode(Array(CODE_LENGTH).fill(""));
      setVerificationEmail(
        result?.email || verificationEmail
      );
      setAuthMessage("A new verification code was sent.");
      setResendSeconds(60);

      window.setTimeout(() => {
        codeRefs.current[0]?.focus();
      }, 50);
    } catch (error: any) {
      setAuthError(
        error?.message || "Could not resend the code."
      );
    } finally {
      setBusy(false);
    }
  }

  async function signout() {
    await apiFetch("/auth/logout/", {
      method: "POST",
      body: "{}",
    });

    setMe({ authenticated: false });
    setOrders([]);
    setAddresses([]);
    setAuthMode("login");
    router.push("/account");
    router.refresh();
  }

  if (me === null) {
    return (
      <main className="lv-auth-page">
        <div className="lv-auth-loading">
          <Loader2 className="lv-spin" size={24} />
          <span>LOADING ACCOUNT</span>
        </div>
        <AccountStyles />
      </main>
    );
  }

  if (!me.authenticated && authMode === "register") {
    return (
      <main className="lv-create-page">
        <div className="lv-create-topbar">
          <Link href="/" className="lv-create-logo">LE VAURÉ</Link>
          <span>MYLV ACCOUNT CREATION</span>
        </div>

        <section className="lv-create-shell">
          <h1>Create your account</h1>

          <div className="lv-create-socials">
            <button type="button" onClick={() => setAuthMessage("Google sign-in can be connected when OAuth is enabled.")}>
              <span className="lv-create-google">G</span> Continue with Google
            </button>
            <button type="button" onClick={() => setAuthMessage("Apple sign-in can be connected when OAuth is enabled.")}>
              <span className="lv-create-apple">●</span> Continue with Apple
            </button>
          </div>

          <div className="lv-create-intro">
            <p>Create an account for a more personal LE VAURÉ experience.</p>
            <p>Already have an account? <button type="button" onClick={() => switchAuthMode("login")}>Sign in here</button></p>
            <span>Required fields*</span>
          </div>

          <form className="lv-create-form" onSubmit={submitRegister}>
            <div className="lv-create-grid">
              <div className="lv-create-col">
                <label>
                  <span>Email address*</span>
                  <input type="email" autoComplete="email" required value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
                </label>
                <label>
                  <span>Confirm email address*</span>
                  <input type="email" autoComplete="email" required value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} />
                </label>
                <label>
                  <span>Password*</span>
                  <div className="lv-create-password">
                    <input type={showRegisterPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowRegisterPassword((v) => !v)} aria-label="Show or hide password">
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="lv-create-col">
                <label>
                  <span>Salutation*</span>
                  <select required value={salutation} onChange={(e) => setSalutation(e.target.value)}>
                    <option value="">Choose your salutation</option>
                    <option value="mr">Mr.</option>
                    <option value="mrs">Mrs.</option>
                    <option value="mx">Mx.</option>
                  </select>
                </label>
                <label>
                  <span>First name*</span>
                  <input type="text" autoComplete="given-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </label>
                <label>
                  <span>Last name*</span>
                  <input type="text" autoComplete="family-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </label>
                <label>
                  <span>Phone</span>
                  <div className="lv-create-phone">
                    <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)}>
                      <option value="+49">+49</option>
                      <option value="+374">+374</option>
                      <option value="+33">+33</option>
                      <option value="+44">+44</option>
                      <option value="+1">+1</option>
                    </select>
                    <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </label>
                <label>
                  <span>Date of birth</span>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </label>
              </div>
            </div>

            <label className="lv-create-consent">
              <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} />
              <span>I agree to receive LE VAURÉ news, product and service communications. You can unsubscribe at any time.</span>
            </label>

            <AuthFeedback error={authError} message={authMessage} />

            <div className="lv-create-submit-row">
              <button type="submit" disabled={busy}>
                {busy ? <Loader2 className="lv-spin" size={17} /> : "CONTINUE"}
              </button>
              <p>You will receive an activation code by email to confirm the creation of your account.</p>
            </div>
          </form>
        </section>
        <AccountStyles />
      </main>
    );
  }

  if (!me.authenticated) {
    // Redirect effect above takes signed-out users to Home where the
    // global account drawer opens. Render nothing here so the old
    // centered login card never flashes on screen.
    return null;
  }

  return (
    <main className="account-page-ref">
      <section
        className="account-head-ref"
        style={{
          backgroundColor: hero?.backgroundColor,
          color: hero?.textColor,
          minHeight: hero?.minHeight || undefined,
          backgroundImage: hero?.image
            ? `linear-gradient(#0005,#0005),url(${hero.image})`
            : undefined,
          backgroundPosition:
            hero?.imagePosition || undefined,
        }}
      >
        <div className="container">
          <div className="eyebrow">
            {hero?.eyebrow || "MY LE VAURÉ"}
          </div>
          <div className="account-title-ref">
            <div>
              <h1>{hero?.title || "ACCOUNT"}</h1>
              <p>
                {hero?.body ||
                  me?.email ||
                  "Loading your account…"}
              </p>
            </div>
            <button
              onClick={signout}
              className="account-signout-ref"
            >
              SIGN OUT <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      <section className="container account-dashboard-ref">
        <div className="account-quick-grid">
          <div className="account-quick-card">
            <Package size={24} />
            <div>
              <span>ORDERS</span>
              <strong>{orders.length}</strong>
            </div>
          </div>

          <Link
            href="/wishlist"
            className="account-quick-card"
          >
            <Heart size={24} />
            <div>
              <span>WISHLIST</span>
              <strong>VIEW</strong>
            </div>
          </Link>

          <div className="account-quick-card">
            <MapPin size={24} />
            <div>
              <span>ADDRESSES</span>
              <strong>{addresses.length}</strong>
            </div>
          </div>

          <Link
            href="/cart"
            className="account-quick-card"
          >
            <ShoppingBag size={24} />
            <div>
              <span>CART</span>
              <strong>OPEN</strong>
            </div>
          </Link>
        </div>

        <div className="account-content-grid-ref">
          <section className="account-panel-ref">
            <div className="account-panel-head-ref">
              <div>
                <div className="eyebrow">
                  PURCHASE HISTORY
                </div>
                <h2>YOUR ORDERS</h2>
              </div>
              <Link href="/shop">
                CONTINUE SHOPPING <ArrowRight size={13} />
              </Link>
            </div>

            {orders.length ? (
              orders.map((order) => (
                <article
                  className="account-order-ref"
                  key={order.id}
                >
                  <div className="account-order-top-ref">
                    <div>
                      <span>ORDER</span>
                      <strong>{order.number}</strong>
                    </div>
                    <div>
                      <span>DATE</span>
                      <strong>
                        {new Date(
                          order.createdAt
                        ).toLocaleDateString()}
                      </strong>
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
                    {(order.items || []).map(
                      (item: any, i: number) => (
                        <div key={i}>
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <small>
                            {[item.color, item.size]
                              .filter(Boolean)
                              .join(" / ")}
                          </small>
                        </div>
                      )
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="account-empty-ref">
                <Package size={28} />
                <h3>NO ORDERS YET</h3>
                <p>
                  Your completed orders will appear here.
                </p>
                <Link
                  href="/shop"
                  className="outline-cta"
                >
                  SHOP THE COLLECTION
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </section>

          <aside className="account-panel-ref account-address-panel-ref">
            <div className="eyebrow">
              DELIVERY DETAILS
            </div>
            <h2>SAVED ADDRESSES</h2>

            {addresses.length ? (
              addresses.map((address) => (
                <div
                  className="address-card-ref"
                  key={address.id}
                >
                  <MapPin size={18} />
                  <div>
                    <strong>
                      {address.label || "ADDRESS"}
                    </strong>
                    <p>
                      {address.fullName}
                      <br />
                      {address.street} {address.apartment}
                      <br />
                      {address.city}, {address.region}{" "}
                      {address.postalCode}
                      <br />
                      {address.phone}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="address-empty-ref">
                <MapPin size={23} />
                <p>
                  No saved address yet. Your checkout details
                  can be stored here.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <AccountStyles />
    </main>
  );
}

function AuthFeedback({
  error,
  message,
}: {
  error: string;
  message: string;
}) {
  if (!error && !message) return null;

  return (
    <div
      className={
        error
          ? "lv-auth-feedback error"
          : "lv-auth-feedback success"
      }
    >
      {error || message}
    </div>
  );
}

function AccountStyles() {
  return (
    <style>{`
      .lv-auth-page {
        min-height: calc(100vh - 90px);
        background: #f2f0eb;
        padding: clamp(20px, 4vw, 56px);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #111;
      }

      .lv-auth-layout {
        width: min(1120px, 100%);
        min-height: 720px;
        display: grid;
        grid-template-columns: 0.92fr 1.08fr;
        background: #fff;
        border: 1px solid #dedbd4;
        box-shadow: 0 24px 70px rgba(0,0,0,.06);
      }

      .lv-auth-story {
        position: relative;
        overflow: hidden;
        padding: 48px;
        background:
          radial-gradient(circle at 80% 18%, rgba(196,169,118,.16), transparent 33%),
          linear-gradient(145deg, #171714 0%, #0d0d0c 72%, #1b1915 100%);
        color: #fff;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .lv-auth-story:after {
        content: "";
        position: absolute;
        width: 330px;
        height: 330px;
        right: -150px;
        bottom: 70px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 50%;
      }

      .lv-auth-brand,
      .lv-auth-mobile-brand {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 22px;
        letter-spacing: 5px;
      }

      .lv-auth-story-copy {
        position: relative;
        z-index: 1;
        max-width: 410px;
      }

      .lv-auth-kicker,
      .lv-auth-heading > span {
        display: block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 2.4px;
      }

      .lv-auth-kicker {
        color: #c8b58e;
        margin-bottom: 20px;
      }

      .lv-auth-story h1 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(42px, 5vw, 66px);
        font-weight: 400;
        line-height: .98;
        letter-spacing: -2px;
      }

      .lv-auth-story p {
        margin: 28px 0 0;
        max-width: 380px;
        color: rgba(255,255,255,.68);
        font-size: 14px;
        line-height: 1.8;
      }

      .lv-auth-benefits {
        margin-top: 34px;
        display: grid;
        gap: 12px;
      }

      .lv-auth-benefits div {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        letter-spacing: .5px;
        color: rgba(255,255,255,.84);
      }

      .lv-auth-benefits svg {
        color: #c8b58e;
      }

      .lv-auth-story-foot {
        position: relative;
        z-index: 1;
        font-size: 9px;
        letter-spacing: 2.2px;
        color: rgba(255,255,255,.4);
      }

      .lv-auth-panel {
        padding: clamp(32px, 5vw, 72px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        background: #fff;
      }

      .lv-auth-mobile-brand {
        display: none;
        margin-bottom: 30px;
      }

      .lv-auth-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-bottom: 1px solid #dedbd4;
        margin-bottom: 48px;
      }

      .lv-auth-tabs button {
        appearance: none;
        border: 0;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        padding: 0 8px 15px;
        background: transparent;
        color: #8b8b86;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.7px;
        cursor: pointer;
      }

      .lv-auth-tabs button.active {
        color: #111;
        border-bottom-color: #111;
      }

      .lv-auth-form {
        width: 100%;
        max-width: 520px;
        margin: 0 auto;
      }

      .lv-auth-heading {
        margin-bottom: 34px;
      }

      .lv-auth-heading > span {
        color: #8f7d5a;
        margin-bottom: 12px;
      }

      .lv-auth-heading h2 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(38px, 4vw, 52px);
        font-weight: 400;
        letter-spacing: -1.5px;
        line-height: 1;
      }

      .lv-auth-heading p {
        margin: 16px 0 0;
        max-width: 470px;
        color: #6e6e69;
        font-size: 13px;
        line-height: 1.7;
      }

      .lv-auth-heading p strong {
        display: block;
        color: #111;
        margin-top: 5px;
        overflow-wrap: anywhere;
      }

      .lv-name-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .lv-field {
        display: block;
        margin-bottom: 18px;
      }

      .lv-field > span {
        display: block;
        margin-bottom: 8px;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 1.3px;
      }

      .lv-input-wrap {
        height: 52px;
        border: 1px solid #d8d5cf;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 15px;
        background: #fff;
        transition: border-color .18s ease, box-shadow .18s ease;
      }

      .lv-input-wrap:focus-within {
        border-color: #111;
        box-shadow: 0 0 0 1px #111;
      }

      .lv-input-wrap > svg {
        color: #8f8e88;
        flex: 0 0 auto;
      }

      .lv-input-wrap input {
        width: 100%;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: #111;
        font: inherit;
        font-size: 13px;
      }

      .lv-input-wrap input::placeholder {
        color: #aaa8a1;
      }

      .lv-password-toggle {
        width: 34px;
        height: 34px;
        border: 0;
        background: transparent;
        color: #777;
        display: grid;
        place-items: center;
        cursor: pointer;
      }

      .lv-security-note {
        display: flex;
        align-items: center;
        gap: 9px;
        margin: 2px 0 20px;
        color: #71706a;
        font-size: 11px;
        line-height: 1.5;
      }

      .lv-security-note svg {
        color: #8f7d5a;
      }

      .lv-auth-feedback {
        margin: 0 0 16px;
        padding: 12px 14px;
        border: 1px solid;
        font-size: 12px;
        line-height: 1.5;
      }

      .lv-auth-feedback.error {
        border-color: #e2b9b4;
        background: #fff7f6;
        color: #9a2b20;
      }

      .lv-auth-feedback.success {
        border-color: #bfcfbd;
        background: #f7fbf6;
        color: #315f38;
      }

      .lv-auth-submit {
        width: 100%;
        min-height: 54px;
        border: 1px solid var(--button-bg, #111);
        background: var(--button-bg, #111);
        color: var(--button-text, #fff);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 11px;
        padding: 0 20px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.5px;
        cursor: pointer;
        transition: background .2s ease, color .2s ease, opacity .2s ease;
      }

      .lv-auth-submit:hover:not(:disabled) {
        background: var(--button-hover-bg, #292929);
        color: var(--button-hover-text, #fff);
      }

      .lv-auth-submit:disabled {
        cursor: wait;
        opacity: .65;
      }

      .lv-auth-switch-copy {
        margin-top: 20px;
        text-align: center;
        color: #7c7b76;
        font-size: 11px;
      }

      .lv-auth-switch-copy button {
        border: 0;
        border-bottom: 1px solid #111;
        padding: 0 0 2px;
        background: transparent;
        color: #111;
        font: inherit;
        cursor: pointer;
      }

      .lv-verify-form {
        max-width: 560px;
      }

      .lv-verify-back {
        border: 0;
        background: transparent;
        padding: 0;
        margin: 0 0 38px;
        color: #777;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 1.5px;
        cursor: pointer;
      }

      .lv-verify-icon {
        width: 52px;
        height: 52px;
        display: grid;
        place-items: center;
        margin-bottom: 25px;
        border: 1px solid #ddd5c7;
        background: #f7f4ee;
        color: #8f7d5a;
        border-radius: 50%;
      }

      .lv-verify-heading {
        margin-bottom: 30px;
      }

      .lv-code-row {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
      }

      .lv-code-row input {
        width: 100%;
        min-width: 0;
        aspect-ratio: 1 / 1.06;
        border: 1px solid #d6d2ca;
        outline: 0;
        background: #faf9f6;
        text-align: center;
        color: #111;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(24px, 3.2vw, 34px);
        transition: border-color .18s ease, background .18s ease, box-shadow .18s ease;
      }

      .lv-code-row input:focus {
        border-color: #111;
        background: #fff;
        box-shadow: 0 0 0 1px #111;
      }

      .lv-code-expiry {
        margin: 13px 0 22px;
        text-align: center;
        color: #8a8983;
        font-size: 10px;
      }

      .lv-resend-area {
        margin-top: 22px;
        padding-top: 20px;
        border-top: 1px solid #ece8e1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: #85847f;
        font-size: 11px;
      }

      .lv-resend-area button {
        border: 0;
        background: transparent;
        padding: 0;
        color: #111;
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 1.1px;
        cursor: pointer;
      }

      .lv-resend-area button:disabled {
        color: #aaa9a4;
        cursor: default;
      }

      .lv-auth-loading {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #777;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.5px;
      }

      .lv-spin {
        animation: lv-spin .8s linear infinite;
      }

      @keyframes lv-spin {
        to { transform: rotate(360deg); }
      }

      /* Full-width account creation — maison reference layout */
      .lv-create-page {
        min-height: 100vh;
        background: #fff;
        color: #111;
      }
      .lv-create-topbar {
        height: 36px;
        border-bottom: 1px solid #dedede;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 14px;
        font-size: 10px;
        letter-spacing: .02em;
      }
      .lv-create-logo {
        font-weight: 800;
        letter-spacing: .06em;
        padding-right: 8px;
        border-right: 1px solid #111;
      }
      .lv-create-shell {
        width: min(1400px, calc(100% - 64px));
        margin: 0 auto;
        padding: 42px 0 34px;
      }
      .lv-create-shell h1 {
        margin: 0 0 18px;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 18px;
        font-weight: 500;
      }
      .lv-create-socials {
        display: grid;
        gap: 12px;
      }
      .lv-create-socials button {
        width: 100%;
        height: 44px;
        border: 1px solid #111;
        border-radius: 999px;
        background: #fff;
        color: #111;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-size: 12px;
        cursor: pointer;
      }
      .lv-create-google {
        font: 800 18px Arial, sans-serif;
        background: conic-gradient(from -45deg,#4285f4 0 25%,#34a853 0 50%,#fbbc05 0 75%,#ea4335 0);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .lv-create-apple { font-size: 17px; }
      .lv-create-intro {
        position: relative;
        margin-top: 16px;
        font-size: 11px;
        line-height: 1.55;
      }
      .lv-create-intro p { margin: 0 0 8px; }
      .lv-create-intro button {
        border: 0;
        border-bottom: 1px solid #111;
        padding: 0 0 1px;
        background: transparent;
        font: inherit;
        cursor: pointer;
      }
      .lv-create-intro > span {
        position: absolute;
        right: 0;
        bottom: -26px;
      }
      .lv-create-form { margin-top: 48px; }
      .lv-create-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 28px;
      }
      .lv-create-col { display: grid; align-content: start; gap: 22px; }
      .lv-create-col label > span {
        display: block;
        margin-bottom: 7px;
        font-size: 11px;
      }
      .lv-create-col input,
      .lv-create-col select {
        width: 100%;
        height: 42px;
        border: 1px solid #aaa;
        border-radius: 0;
        background: #fff;
        color: #111;
        padding: 0 12px;
        font: inherit;
        outline: none;
      }
      .lv-create-col input:focus,
      .lv-create-col select:focus { border-color: #111; box-shadow: 0 0 0 1px #111; }
      .lv-create-password { position: relative; }
      .lv-create-password input { padding-right: 48px; }
      .lv-create-password button {
        position: absolute;
        right: 4px;
        top: 3px;
        width: 36px;
        height: 36px;
        border: 0;
        background: transparent;
        display: grid;
        place-items: center;
        cursor: pointer;
      }
      .lv-create-phone {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 4px;
      }
      .lv-create-consent {
        max-width: 670px;
        margin-top: 18px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 10px;
        line-height: 1.5;
      }
      .lv-create-consent input { margin: 3px 0 0; width: 14px; height: 14px; }
      .lv-create-submit-row {
        width: 255px;
        margin: 12px 0 0 auto;
      }
      .lv-create-submit-row button {
        width: 100%;
        height: 44px;
        border: 1px solid #111;
        border-radius: 999px;
        background: #111;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .05em;
        cursor: pointer;
      }
      .lv-create-submit-row p {
        margin: 14px 0 0;
        font-size: 10px;
        line-height: 1.6;
      }

      @media (max-width: 850px) {
        .lv-create-shell { width: calc(100% - 36px); padding-top: 28px; }
        .lv-create-grid { grid-template-columns: 1fr; gap: 22px; }
        .lv-create-submit-row { width: 100%; margin-top: 28px; }
        .lv-create-intro > span { position: static; display: block; margin-top: 14px; }
        .lv-create-form { margin-top: 28px; }
      }

      @media (max-width: 850px) {
        .lv-auth-page {
          padding: 0;
          align-items: stretch;
          background: #fff;
        }

        .lv-auth-layout {
          min-height: calc(100vh - 70px);
          grid-template-columns: 1fr;
          border: 0;
          box-shadow: none;
        }

        .lv-auth-story {
          display: none;
        }

        .lv-auth-panel {
          padding: 42px 22px 58px;
          justify-content: flex-start;
        }

        .lv-auth-mobile-brand {
          display: block;
          text-align: center;
          font-size: 19px;
        }

        .lv-auth-tabs {
          margin-bottom: 38px;
        }

        .lv-auth-form {
          max-width: 560px;
        }
      }

      @media (max-width: 540px) {
        .lv-name-grid {
          grid-template-columns: 1fr;
          gap: 0;
        }

        .lv-auth-heading h2 {
          font-size: 38px;
        }

        .lv-code-row {
          gap: 6px;
        }

        .lv-code-row input {
          font-size: 25px;
        }

        .lv-resend-area {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `}</style>
  );
}
