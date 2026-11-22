"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { CompteEndur, Countdown } from "@/components/Countdown";
import { Split } from "@/components/Kinetic";

function Carte({
  href,
  className,
  image,
  focus,
  children,
  index,
}: {
  href?: string;
  className: string;
  image?: string;
  focus?: string;
  children: ReactNode;
  index: number;
}) {
  const corps = (
    <>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="bento-image" src={image} alt="" loading="lazy" decoding="async" draggable={false} style={{ objectPosition: focus }} />
      ) : (
        <span className="bento-mesh" aria-hidden="true" />
      )}
      <span className="bento-voile" aria-hidden="true" />
      <span className="bento-contenu">{children}</span>
    </>
  );
  const style = { ["--b" as string]: index } as CSSProperties;
  return href ? (
    <Link className={`bento-carte ${className}`} href={href} data-glow="" style={style}>
      {corps}
    </Link>
  ) : (
    <div className={`bento-carte ${className}`} data-glow="" style={style}>
      {corps}
    </div>
  );
}

/** Une carte du site en mosaïque : chaque case mène quelque part, et réagit au curseur. */
export function Bento() {
  return (
    <section className="bento shell" aria-labelledby="titre-bento">
      <p className="kicker bento-kicker">
        <Split text="Explorer" mode="chars" lang />
      </p>
      <h2 className="bento-titre" id="titre-bento">
        <Split text="Franck J.H. Christen" mode="chars" className="kt-x" />
      </h2>
      <div className="bento-grille">
        <Carte href="/qui-suis-je" className="bento-qui" image="/media/franck.jpg" focus="50% 30%" index={0}>
          <span className="bento-etiquette">01 — Qui suis-je</span>
          <span className="bento-grand">
            <Split text="Bonjour, je m’appelle Franck." />
          </span>
          <span className="bento-petit">Je suis né en 2007 en France.</span>
        </Carte>
        <Carte className="bento-citation" index={1}>
          <span className="bento-etiquette">Citation</span>
          <span className="bento-moyen">
            <Split text={"« Ta deuxième vie commence quand tu comprends que tu n’en as qu’une. »"} />
          </span>
          <span className="bento-petit">— Raphaëlle Giordano</span>
        </Carte>
        <Carte href="/a-propos" className="bento-apropos" image="/fond/judo-640.webp" focus="50% 22%" index={2}>
          <span className="bento-etiquette">02 — À propos</span>
          <span className="bento-petit">La vie, les projets et les annonces de Franck.</span>
        </Carte>
        <Carte href="/contact" className="bento-contact" image="/fond/avion-640.webp" focus="68% 42%" index={3}>
          <span className="bento-etiquette">03 — Contact</span>
          <span className="bento-petit" translate="no">
            franckjhchristen@gmail.com
          </span>
        </Carte>
        <Carte href="/projets" className="bento-projets" image="/fond/rose-640.webp" focus="46% 34%" index={4}>
          <span className="bento-etiquette">04 — Projets · Endurreisen</span>
          <CompteEndur>
            <Countdown />
          </CompteEndur>
        </Carte>
        <a
          className="bento-carte bento-insta"
          href="https://instagram.com/fjhchristenhmbk"
          rel="noopener noreferrer"
          target="_blank"
          data-glow=""
          style={{ ["--b" as string]: 5 } as CSSProperties}
        >
          <span className="bento-mesh" aria-hidden="true" />
          <span className="bento-voile" aria-hidden="true" />
          <span className="bento-contenu">
            <span className="bento-etiquette">Instagram</span>
            <span className="bento-moyen" translate="no">
              @fjhchristenhmbk
            </span>
          </span>
        </a>
      </div>
    </section>
  );
}
