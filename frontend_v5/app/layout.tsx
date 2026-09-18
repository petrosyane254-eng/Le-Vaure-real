import "./globals.css";
import type { Metadata } from "next";
import DesignRuntime from "@/components/DesignRuntime";
import SiteChrome from "@/components/SiteChrome";

const SITE_URL = "https://xn--levaur-gva.store";

const BRAND_ALTERNATES = [
  "LE VAURÉ",
  "LE VAURE",
  "LEVAURÉ",
  "LEVAURE",
  "LE VAUR",
  "LEVAUR",
  "VAURÉ",
  "VAURE",
  "Le Vauré",
  "Le Vaure",
  "Levauré",
  "Levaure",
  "Le Vaur",
  "Levaur",
  "Vauré",
  "Vaure",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "LE VAURÉ | Armenian Fashion",
    template: "%s | LE VAURÉ",
  },

  description:
    "Discover LE VAURÉ (LE VAURE / LEVAURE), an Armenian fashion brand featuring contemporary clothing and distinctive collections.",

  applicationName: "LE VAURÉ",

  keywords: [
    "LE VAURÉ",
    "LE VAURE",
    "LEVAURÉ",
    "LEVAURE",
    "LE VAUR",
    "LEVAUR",
    "VAURÉ",
    "VAURE",
    "Le Vauré",
    "Le Vaure",
    "Levaure",
    "Armenian fashion",
    "Armenian clothing",
    "Armenian fashion brand",
    "Armenian designer clothing",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "LE VAURÉ",
    title: "LE VAURÉ | Armenian Fashion",
    description:
      "Discover LE VAURÉ (LE VAURE / LEVAURE), an Armenian fashion brand featuring contemporary clothing and distinctive collections.",
  },

  twitter: {
    card: "summary_large_image",
    title: "LE VAURÉ | Armenian Fashion",
    description:
      "Discover LE VAURÉ (LE VAURE / LEVAURE), an Armenian fashion brand featuring contemporary clothing and distinctive collections.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: "LE VAURÉ",
  alternateName: BRAND_ALTERNATES,
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": `${SITE_URL}/#organization`,
  name: "LE VAURÉ",
  alternateName: BRAND_ALTERNATES,
  url: `${SITE_URL}/`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="site-layout">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        <DesignRuntime />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}