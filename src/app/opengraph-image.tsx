import { renderOgImage, ogImageSize, ogImageContentType } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage(
    "Decide anything with a beautifully random click.",
    "Spin wheels, draw winners, split teams, roll dice — one fast, private toolkit for every decision."
  );
}
