import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "Spin Wheel",
  description:
    "A smooth, weighted spin wheel that lands on exactly one winner. Custom colors, weighted odds, and instant replays.",
  path: "wheel",
  noIndex: false,
});

export default function Page() {
  return <PickerApp />;
}
