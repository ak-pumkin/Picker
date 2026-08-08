import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "Dice Roller",
  description:
    "Roll one or more dice with real pip faces and a physics-y tumble animation.",
  path: "dice",
  noIndex: false,
});

export default function Page() {
  return <PickerApp />;
}
