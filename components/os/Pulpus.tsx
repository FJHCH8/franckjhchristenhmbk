"use client";

/**
 * Pulpüs market : la boutique d'applis d'AakanOS, en 8 bits (logo : Pulpüs la poulpe qui porte son sac).
 * À l'ouverture, un chargement… puis elle dort sur ses livres ouverts : pas d'internet.
 */
import { useEffect, useState } from "react";

/** Dessine une grille de pixels (une lettre = une couleur, « . » = vide), en regroupant les pixels voisins. */
function Pixels({ lignes, pal }: { lignes: string[]; pal: Record<string, string> }) {
  const rects: React.ReactElement[] = [];
  lignes.forEach((l, y) => {
    let x = 0;
    while (x < l.length) {
      const c = l[x];
      let n = 1;
      while (l[x + n] === c) n++;
      if (pal[c]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={n + 0.04} height={1.04} fill={pal[c]} />);
      x += n;
    }
  });
  return <>{rects}</>;
}

const PAL = {
  r: "#ee2a22", d: "#b3161b", y: "#ffc33a", k: "#2a0f0a", w: "#ffffff", g: "#5b6670", h: "#8a96a2",
  b: "#33b5e5", B: "#1f6fa8", v: "#6fbf4a", V: "#3e8a2a", p: "#fbf6e8", l: "#cfc4a6", c: "#9c8a62",
  u: "#7cc8f0", s: "#d6f0ff", z: "#5aa9dd",
};

/** Le logo 8 bits : Pulpüs, la poulpe, qui porte son petit sac de courses bleu. */
const LOGO = [
  "",
  "",
  "",
  "",
  "........rrrr",
  "......rrrrrrrr",
  ".....rryrrrrrrr",
  ".....ryyrrrrrrr",
  "....rryrrrrrrrrr",
  "....rrrkwrrrkwrrhhhh",
  "....rrrkkrrrkkrh....h",
  "....rrrrrkkrrrggggggggg",
  "....drrrrrrrrrrrbbbbbBg",
  "....rr.rr.rr.rgbbbbbbBg",
  "....r..r..r..rgbbwbbbBg",
  "..............gbbbbbbBg",
  "..............ggggggggg",
];

export function LogoPulpus({ taille = 56 }: { taille?: number }) {
  return (
    <svg className="os-icone" viewBox="0 0 24 24" width={taille} height={taille} shapeRendering="crispEdges" aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#13324d" />
      <Pixels lignes={LOGO} pal={PAL} />
    </svg>
  );
}

/** Hors connexion : Pulpüs s'est endormie sur ses livres ouverts (image fixe). */
const DORT = [
  "................................zzzz........",
  "...................................z........",
  "..................................z.........",
  ".................................z..........",
  "................................zzzz........",
  "............................................",
  "...........rrrr............zzz..............",
  ".........rrrrrrrr............z..............",
  "........rryrrrrrrr..........z...............",
  ".......ryyrrrrrrrrr........zzz..............",
  ".......ryrrrrrrrrrrr........................",
  "......rrrrrrrrrrrrrrr.......................",
  "......rrkkkrrrrkkkrrr.uuu...................",
  "......rrrrrrrrrrrrrrruwssu..................",
  "......rrrrrrkkrrrrrrrussus..................",
  ".....drrrrrrrrrrrrrrdussus..................",
  ".....rrrrrrrrrrrrrrrr.uuu....ppppp.ppppp....",
  ".....prrpppppcppppprrp......pplplpcplplpp...",
  "....pplllllppcpplllllpp....pppppppcppppppp..",
  "....pppppppppcpppppppppp...ccccccccccccccc..",
  "...ppllllppppcppllllppp.....................",
  "...ppppppppppcpppppppppp......vwwwwwwwwv....",
  "...cccccccccccccccccccc.......VVVVVVVVVV....",
  ".............................bbbbbbbbbbb....",
  ".............................bwwwwwwwwwb....",
  ".............................BBBBBBBBBBB...."
];

export function AppPulpus() {
  const [charge, setCharge] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setCharge(false), 1800);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="pulpus">
      {charge ? (
        <div className="pulpus-charge">
          <i />
          <span>Chargement…</span>
        </div>
      ) : (
        <div className="pulpus-hs">
          <svg className="pulpus-dort" viewBox="0 0 44 26" width="250" shapeRendering="crispEdges" aria-hidden="true">
            <Pixels lignes={DORT} pal={PAL} />
          </svg>
          <p>Vous n’êtes malheureusement pas connecté à internet.</p>
          <button type="button" className="pulpus-reessayer" onClick={() => setCharge(true)}>
            RÉESSAYER
          </button>
        </div>
      )}
    </div>
  );
}
