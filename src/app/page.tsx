import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "./PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "Random Picker, Spin Wheel & Decision Tools",
  description:
    "Picker is a fast, beautiful random picker: spin wheels, pick winners, generate teams, run brackets, roll dice, flip coins, and more. No account required.",
  path: "",
});

export default function Page() {
  return <PickerApp />;
}
