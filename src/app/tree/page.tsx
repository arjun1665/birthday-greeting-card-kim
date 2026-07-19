import AncientTreeClient from "@/components/AncientTreeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ancient Tree",
};

export default function TreePage() {
  return <AncientTreeClient />;
}
