import type { MetadataRoute } from "next";
import { navigation } from "@/config/navigation";
import { baseUrl } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  return navigation.map((n) => ({ url: `${baseUrl}${n.href === "/" ? "" : n.href}` }));
}
