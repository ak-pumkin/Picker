import { renderOgImage, ogImageSize, ogImageContentType } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage(
    "Random Picker",
    "Pick one or more random winners from any list — paste names, import a CSV, and draw instantly."
  );
}
