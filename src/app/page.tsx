import HomeClient from "@/components/HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Someone has something for you...",
};

export default function Page() {
  return <HomeClient />;
}
