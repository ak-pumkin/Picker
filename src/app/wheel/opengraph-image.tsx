import { renderOgImage, ogImageSize, ogImageContentType } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage(
    "Spin Wheel",
    "A smooth, weighted spin wheel that lands on exactly one winner. Custom colors, weighted odds, and instant replays."
  );
}
