import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string; // e.g. "" for home, "wheel", "bracket"
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}/${opts.path}`.replace(/\/$/, "") || SITE_URL;

  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: "Picker",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
  };
}
