import { NextRequest, NextResponse } from "next/server";

const DJANGO =
  process.env.DJANGO_INTERNAL_URL || "http://127.0.0.1:8000";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;

  const qs = request.nextUrl.search || "";
  const url = `${DJANGO}/api/${path.join("/")}/${qs}`;

  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const k = key.toLowerCase();

    if (
      k !== "host" &&
      k !== "content-length" &&
      k !== "origin" &&
      k !== "referer"
    ) {
      headers.set(key, value);
    }
  });

  // Django should see the request as coming from itself.
  headers.set("Host", new URL(DJANGO).host);

  // Forward browser cookies explicitly.
  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(url, init);
    const body = await upstream.arrayBuffer();

    const outHeaders = new Headers();

    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase();

      if (
        k !== "content-encoding" &&
        k !== "content-length" &&
        k !== "set-cookie"
      ) {
        outHeaders.append(key, value);
      }
    });

    // Forward Django cookies to localhost frontend.
    const getSetCookie = (
      upstream.headers as Headers & {
        getSetCookie?: () => string[];
      }
    ).getSetCookie;

    let cookies: string[] = [];

    if (typeof getSetCookie === "function") {
      cookies = getSetCookie.call(upstream.headers);
    } else {
      const rawCookie = upstream.headers.get("set-cookie");
      if (rawCookie) cookies = [rawCookie];
    }

    for (let cookieValue of cookies) {
      // Remove backend Domain attribute so browser stores
      // the cookie for the frontend host.
      cookieValue = cookieValue.replace(
        /;\s*Domain=[^;]+/gi,
        ""
      );

      outHeaders.append("set-cookie", cookieValue);
    }

    return new NextResponse(body, {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch (error) {
    console.error("Django proxy error", error);

    return NextResponse.json(
      {
        error: "Could not connect to Django backend.",
      },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;