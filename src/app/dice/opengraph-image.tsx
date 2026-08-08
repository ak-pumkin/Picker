import { renderOgImage, ogImageSize, ogImageContentType } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage(
    "Dice Roller",
    "Roll one or more dice with real pip faces and a physics-y tumble animation."
  );
}
