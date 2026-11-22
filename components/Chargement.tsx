import type { CSSProperties } from "react";

const ORBES = 12;

/** L'anneau de chargement façon console, affiché seulement si une page tarde à venir (classe html.nav-lent). */
export function Chargement() {
  return (
    <div className="chargement" aria-hidden="true">
      <div className="intro-anneau">
        {Array.from({ length: ORBES }, (_, i) => (
          <span key={i} style={{ ["--i" as string]: i, ["--n" as string]: ORBES } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}
