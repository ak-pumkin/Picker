import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "Coin Flip",
  description:
    "Heads or tails, decided instantly with a satisfying flip animation.",
  path: "coin",
  noIndex: false,
});

export default function Page() {
  return <PickerApp />;
}
