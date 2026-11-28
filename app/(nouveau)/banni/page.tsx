import type { Metadata } from "next";
import { Banni } from "@/components/teodor/Banni";

export const metadata: Metadata = { title: { absolute: "Dommage." }, robots: { index: false, follow: false } };

export default function PageBanni() {
  return <Banni />;
}
