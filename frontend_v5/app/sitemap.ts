import type { MetadataRoute } from "next";

const SITE_URL = "https://xn--levaur-gva.store";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/shop`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/collections`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/journal`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
