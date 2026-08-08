import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "More Tools — Yes/No, Color & Password Generator",
  description:
    "Three handy generators in one place: a yes/no picker, random color generator, and password generator.",
  path: "extras",
  noIndex: false,
});

export default function Page() {
  return <PickerApp />;
}
