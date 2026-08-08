import { renderOgImage, ogImageSize, ogImageContentType } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage(
    "Random Number Generator",
    "Draw random numbers from any custom range, with or without duplicates."
  );
}
