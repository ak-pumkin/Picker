import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "Saved Lists",
  description:
    "Manage and reuse your saved lists across every tool.",
  path: "lists",
  noIndex: true,
});

export default function Page() {
  return <PickerApp />;
}
