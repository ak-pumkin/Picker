import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "Bracket",
  description:
    "Randomly seed your list into head-to-head matchups and play through elimination rounds to a single winner.",
  path: "bracket",
  noIndex: false,
});

export default function Page() {
  return <PickerApp />;
}
