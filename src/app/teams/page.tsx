import type { Metadata } from "next";
import { buildMetadata } from "@/lib/pageMeta";
import PickerApp from "../PickerApp";

export const metadata: Metadata = buildMetadata({
  title: "Team Generator",
  description:
    "Split any group into equal or fully random teams in one click.",
  path: "teams",
  noIndex: false,
});

export default function Page() {
  return <PickerApp />;
}
