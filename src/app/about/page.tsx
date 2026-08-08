import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "About Picker",
  description:
    "What Picker is, how it works, and how your data stays private.",
  path: "about",
  noIndex: false,
});

export default function Page() {
  return <PickerApp />;
}
