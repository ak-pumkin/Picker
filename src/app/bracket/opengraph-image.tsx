import { renderOgImage, ogImageSize, ogImageContentType } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage(
    "Bracket",
    "Randomly seed your list into head-to-head matchups and play through elimination rounds to a single winner."
  );
}
