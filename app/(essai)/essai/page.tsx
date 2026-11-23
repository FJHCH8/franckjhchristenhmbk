import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Compte } from "./compte";
import { Lueur } from "./lueur";
import { ProgressionEndurreisen } from "./progression";

/**
 * Accueil d'essai : sombre et précieux comme Raycast, aéré comme Apple, avec l'univers de Franck
 * (sa constellation, l'écriture Aaka, Endurreisen). Fait avec Tailwind, sans rien de l'ancien style.
 */
export default function Essai() {
  return (
    <main className="relative overflow-x-clip">
      <Lueur />

      {/* La lueur bleue et violette du haut de la page. */}
      <div
        aria-hidden="true"
        className="halo pointer-events-none absolute left-1/2 top-[-18rem] h-[42rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(79,140,255,0.35),rgba(164,107,255,0.18)_45%,transparent_70%)] blur-2xl"
      />

      {/* Barre de navigation en verre, flottante. */}
      <nav className="monte fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto flex w-[min(92%,44rem)] items-center justify-between rounded-2xl border border-white/10 bg-[#0b0b10]/80 px-4 py-2.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl backdrop-saturate-150">
        <Link href="/essai" aria-label="Accueil" className="text-white transition-transform duration-500 ease-doux active:scale-90">
          <Logo className="h-7 w-7" />
        </Link>
        <div className="flex items-center gap-1 text-[13px] text-white/70">
          <Link href="/essai" className="rounded-lg px-3 py-1.5 text-white transition hover:bg-white/10">Accueil</Link>
          <Link href="/qui-suis-je" className="rounded-lg px-3 py-1.5 transition hover:bg-white/10 hover:text-white">Qui suis-je</Link>
          <Link href="/projets" className="rounded-lg px-3 py-1.5 transition hover:bg-white/10 hover:text-white">Projets</Link>
        </div>
      </nav>

      {/* ── Ouverture ── */}
      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-5 pt-36 text-center sm:pt-44">
        <Link
          href="/projets"
          className="monte group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-4 text-[13px] text-white/80 backdrop-blur transition hover:border-white/20"
          style={{ animationDelay: "80ms" }}
        >
          <span className="rounded-full bg-gradient-to-r from-accent to-accent-2 px-2.5 py-0.5 text-[11px] font-semibold text-white">Nouveau</span>
          Endurreisen ouvre le 1er décembre
          <span className="transition-transform duration-500 ease-doux group-hover:translate-x-1">→</span>
        </Link>

        <h1 className="monte argent mt-7 text-[clamp(3.2rem,13vw,7.5rem)] font-semibold leading-[0.92] tracking-[-0.055em]" style={{ animationDelay: "160ms" }}>
          Franck J.H.
          <br />
          Christen
        </h1>

        <p className="monte mt-6 max-w-md text-[clamp(1.05rem,4.2vw,1.3rem)] leading-snug text-doux" style={{ animationDelay: "260ms" }}>
          Polymathe. Né différent, il regarde ce que personne ne voulait voir.
        </p>

        <div className="monte mt-8 flex items-center gap-3" style={{ animationDelay: "340ms" }}>
          <Link href="/qui-suis-je" className="rounded-full bg-white px-6 py-3 text-[15px] font-medium text-black shadow-[0_0_40px_-8px_rgba(255,255,255,0.5)] transition duration-500 ease-doux hover:scale-[1.03] active:scale-95">
            Découvrir
          </Link>
          <Link href="/projets" className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-[15px] font-medium text-white/90 backdrop-blur transition duration-500 ease-doux hover:bg-white/[0.08] active:scale-95">
            Les projets
          </Link>
        </div>

        {/* La photo, dans un cadre de verre, avec la constellation qui se trace par-dessus. */}
        <div className="monte relative mt-16 w-full max-w-3xl" style={{ animationDelay: "460ms" }}>
          <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-b from-white/25 via-white/5 to-transparent" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-carte p-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] sm:aspect-[16/10]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/franck-enfant-1500.webp" alt="Franck enfant" className="h-full w-full object-cover object-[50%_25%] grayscale" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <svg viewBox="0 0 200 200" className="absolute right-4 top-4 h-24 w-24 opacity-90 sm:h-32 sm:w-32" aria-hidden="true">
                <path
                  className="trace"
                  pathLength={1}
                  d="M148.7 17.6 L112.1 80.8 L128 89.6 L116.8 91.6 L27.2 75 L29.2 90.4 L70.6 136.2 L123.8 171.7 L168.1 176.5"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-left">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">Né en 2007</p>
                  <p className="mt-1 text-xl font-medium tracking-tight">En France, en Bretagne.</p>
                </div>
                <p className="font-aaka text-2xl leading-none text-white/85" lang="x-tavissiv">
                  franck
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── En chiffres : une grille de cartes, façon Raycast ── */}
      <section className="mx-auto mt-28 max-w-5xl px-5">
        <p className="apparait text-center text-[13px] font-medium uppercase tracking-[0.2em] text-doux">En ce moment</p>
        <h2 className="apparait mx-auto mt-3 max-w-xl text-center text-[clamp(2rem,8vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
          Ce qui se prépare.
        </h2>

        <div className="mt-12 grid gap-4 sm:grid-cols-6">
          <div className="carte apparait rounded-3xl p-6 sm:col-span-4">
            <p className="text-[13px] font-medium text-doux">Endurreisen · ouverture dans</p>
            <div className="mt-5">
              <Compte grand />
            </div>
          </div>

          <div className="carte apparait flex flex-col justify-between rounded-3xl p-6 sm:col-span-2">
            <p className="text-[13px] font-medium text-doux">Projets</p>
            <p className="mt-6 text-6xl font-light tracking-tight">15</p>
            <p className="text-sm text-doux">en préparation, dont la langue Tavissiv.</p>
          </div>

          <div className="carte apparait rounded-3xl p-6 sm:col-span-3">
            <p className="text-[13px] font-medium text-doux">Progression</p>
            <div className="mt-4">
              <ProgressionEndurreisen />
            </div>
          </div>

          <div className="carte apparait flex flex-col justify-between rounded-3xl p-6 sm:col-span-3">
            <p className="text-[13px] font-medium text-doux">L&apos;écriture Aaka</p>
            <p className="mt-5 font-aaka text-4xl leading-[1.5] text-white" lang="x-tavissiv">
              franck j.h christen
            </p>
            <p className="mt-3 text-sm text-doux">La langue Tavissiv, inventée par Franck, dans son propre alphabet.</p>
          </div>

          <figure className="carte apparait rounded-3xl p-8 sm:col-span-6">
            <blockquote className="text-[clamp(1.4rem,5.5vw,2.4rem)] font-medium leading-[1.15] tracking-[-0.03em]">
              « Ta deuxième vie commence quand tu comprends que tu n’en as qu’une. »
            </blockquote>
            <figcaption className="mt-5 text-sm text-doux">Raphaëlle Giordano</figcaption>
          </figure>
        </div>
      </section>

      {/* ── Qui suis-je : une phrase forte, à la Apple ── */}
      <section className="mx-auto mt-32 max-w-3xl px-5 text-center">
        <p className="apparait text-[clamp(1.7rem,7vw,3rem)] font-semibold leading-[1.1] tracking-[-0.04em] text-white/35">
          Depuis toujours, il <span className="text-white">vit, voit, pense et rêve</span> différemment.{" "}
          <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">Il fait tout différemment.</span>
        </p>
        <Link
          href="/qui-suis-je"
          className="apparait mt-10 inline-flex items-center gap-2 text-[15px] font-medium text-accent transition hover:gap-3"
        >
          Qui suis-je <span>›</span>
        </Link>
      </section>

      {/* ── Bas de page ── */}
      <footer className="mx-auto mt-32 max-w-5xl border-t border-white/10 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8 text-white" />
            <span className="text-sm font-medium">Franck J.H. Christen</span>
          </div>
          <span className="text-xs text-doux">Mises à jour environ tous les 7 jours</span>
        </div>
      </footer>
    </main>
  );
}
