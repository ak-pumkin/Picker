import { renderOgImage, ogImageSize, ogImageContentType } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage(
    "Coin Flip",
    "Heads or tails, decided instantly with a satisfying flip animation."
  );
}
