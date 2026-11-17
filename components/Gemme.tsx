type Ton = "ame" | "ciel" | "nature";

function Plaque() {
  return (
    <svg className="gemme-plaque" viewBox="0 0 40 54" aria-hidden="true">
      <polygon points="20,1.5 7,15 20,21" fill="var(--g2)" />
      <polygon points="20,1.5 33,15 20,21" fill="var(--g1)" />
      <polygon points="7,15 20,21 9,35 20,52.5" fill="var(--g3)" />
      <polygon points="33,15 20,21 31,35 20,52.5" fill="var(--g4)" />
      <polygon points="20,21 9,35 31,35" fill="var(--g2)" opacity="0.9" />
      <polygon points="9,35 20,52.5 31,35" fill="var(--g5)" opacity="0.55" />
      <polygon points="17,16 23,16 20,28" fill="#fff" opacity="0.55" />
    </svg>
  );
}

export function Gemme({ tone, petit = false }: { tone: Ton; petit?: boolean }) {
  return (
    <span className={petit ? `gemme gemme-${tone} gemme-petit` : `gemme gemme-${tone}`} aria-hidden="true">
      <span className="gemme-halo" />
      <span className="gemme-scene">
        <span className="gemme-pivot">
        <span className="gemme-spin">
          <span className="gemme-avant">
            <Plaque />
          </span>
          <span className="gemme-dos">
            <Plaque />
          </span>
          <span className="gemme-reflet" />
        </span>
        </span>
      </span>
      <span className="gemme-etincelle" />
      <span className="gemme-etincelle gemme-etincelle-b" />
    </span>
  );
}
