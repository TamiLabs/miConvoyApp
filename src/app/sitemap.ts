import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) return [];

  return [
    {
      url: `${siteUrl}/calculadora`,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
