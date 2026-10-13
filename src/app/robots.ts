import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/giris", "/kayit", "/hesabim", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
