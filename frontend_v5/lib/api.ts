export const API = process.env.NEXT_PUBLIC_API_BASE || "/backend-api";

export async function getCsrf(): Promise<string> {
  const r = await fetch(`${API}/csrf/`, { credentials: "include" });
  if (!r.ok) throw new Error("Could not initialize secure request.");
  const data = await r.json();
  return data.csrfToken;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  if (method !== "GET" && method !== "HEAD") {
    headers.set("X-CSRFToken", await getCsrf());
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }
  const r = await fetch(`${API}${path}`, { ...options, headers, credentials: "include", cache: "no-store" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Request failed.");
  return data as T;
}

type StoreCurrency = "AMD" | "EUR" | "USD";

// Store prices remain in AMD in Django. These are display-only conversion
// rates, so checkout/order totals continue using the original backend amount.
// You can update the two rates below whenever you want.
const DISPLAY_RATES: Record<StoreCurrency, number> = {
  AMD: 1,
  EUR: 1 / 440,
  USD: 1 / 395,
};

function selectedCurrency(): StoreCurrency {
  if (typeof window === "undefined") return "AMD";
  try {
    const saved = window.localStorage.getItem("lv_currency");
    if (saved === "EUR" || saved === "USD" || saved === "AMD") return saved;
  } catch {}
  return "AMD";
}

export const money = (value: string | number) => {
  const amountAMD = Number(value || 0);
  const currency = selectedCurrency();
  const converted = amountAMD * DISPLAY_RATES[currency];

  if (currency === "AMD") {
    return `${converted.toLocaleString("hy-AM", { maximumFractionDigits: 0 })} ֏`;
  }

  return new Intl.NumberFormat(currency === "EUR" ? "de-DE" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
};
