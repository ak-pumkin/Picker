import { renderOgImage, ogImageSize, ogImageContentType } from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage(
    "More Tools — Yes/No, Color & Password Generator",
    "Three handy generators in one place: a yes/no picker, random color generator, and password generator."
  );
}
