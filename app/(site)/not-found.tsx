import type { Metadata } from "next";
import { LocaleProvider } from "@/components/Locale";
import { Page404 } from "@/components/introuvable/Page404";

export const metadata: Metadata = {
  title: { absolute: "404" },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <LocaleProvider>
      <Page404 />
    </LocaleProvider>
  );
}
