import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "History",
  description:
    "Every pick you've made on this device.",
  path: "history",
  noIndex: true,
});

export default function Page() {
  return <PickerApp />;
}
