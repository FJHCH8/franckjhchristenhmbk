/** Le logo de la case Projets, en plat Metro : le bâton, sa boucle de ficelle nouée deux fois, et la boule (une boule pleine dans un cercle). */
export function LogoProjets({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M101 114 L104 20" />
      <path d="M102 38 C84 36 74 46 74 60 C74 74 84 84 101 84" />
      <path d="M104 34 L112 30 M104 42 L113 44 M102 80 L111 76 M102 88 L111 90" />
      <circle cx="100" cy="148" r="34" />
      <circle cx="100" cy="148" r="19" fill="currentColor" stroke="none" />
    </svg>
  );
}
