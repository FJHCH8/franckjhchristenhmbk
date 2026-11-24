import { LocaleProvider } from "@/components/Locale";
import { OdysseeOS } from "@/components/os/OdysseeOS";

export default function PageAakanOS() {
  // Le téléphone parle la langue choisie sur le site (ou dans ses propres réglages).
  return (
    <LocaleProvider>
      <OdysseeOS />
    </LocaleProvider>
  );
}
