import ObservatoryClient from "@/components/ObservatoryClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Constellations",
};

export default function ObservatoryPage() {
  return <ObservatoryClient />;
}
