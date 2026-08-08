import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "Random Picker",
  description:
    "Pick one or more random winners from any list — paste names, import a CSV, and draw instantly.",
  path: "picker",
  noIndex: false,
});

export default function Page() {
  return <PickerApp />;
}
