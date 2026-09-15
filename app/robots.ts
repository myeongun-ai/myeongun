import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/payment/",
        "/mypage",
        "/fortune/detail",
      ],
    },
    sitemap: "https://myeongun.kr/sitemap.xml",
  };
}
