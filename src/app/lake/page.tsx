import StarLakeClient from "@/components/StarLakeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memories",
};

export default function LakePage() {
  return <StarLakeClient />;
}
