import CottageClient from "@/components/CottageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "A Letter",
};

export default function CottagePage() {
  return <CottageClient />;
}
