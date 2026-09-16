export const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  "/backend-api";


export async function getCsrf(): Promise<string> {
  const r = await fetch(
    `${API}/csrf/`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!r.ok) {
    throw new Error(
      "Could not initialize secure request."
    );
  }

  const data = await r.json();

  return data.csrfToken;
}


export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {

  const method =
    (options.method || "GET")
      .toUpperCase();

  const headers =
    new Headers(
      options.headers || {}
    );


  if (
    method !== "GET" &&
    method !== "HEAD"
  ) {
    headers.set(
      "X-CSRFToken",
      await getCsrf()
    );

    if (
      !headers.has(
        "Content-Type"
      )
    ) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }
  }


  const r = await fetch(
    `${API}${path}`,
    {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    }
  );


  const data =
    await r
      .json()
      .catch(() => ({}));


  if (!r.ok) {
    throw new Error(
      data.error ||
      "Request failed."
    );
  }


  return data as T;
}


export const money = (
  value: string | number
) =>
  `${Number(value).toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 0,
    }
  )} Ö`;
