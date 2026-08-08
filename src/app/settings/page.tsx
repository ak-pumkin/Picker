import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "Settings",
  description:
    "Appearance, sound, and account sync settings.",
  path: "settings",
  noIndex: true,
});

export default function Page() {
  return <PickerApp />;
}
