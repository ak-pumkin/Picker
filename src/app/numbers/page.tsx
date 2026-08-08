import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "Random Number Generator",
  description:
    "Draw random numbers from any custom range, with or without duplicates.",
  path: "numbers",
  noIndex: false,
});

export default function Page() {
  return <PickerApp />;
}
