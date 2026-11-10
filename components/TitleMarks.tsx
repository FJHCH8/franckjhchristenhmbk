export function DropsMark() {
  return (
    <svg className="mark mark-drops" viewBox="0 0 150 163" aria-hidden="true">
      <path className="drop" style={{ ["--i" as string]: 1 }} d="M11 49c2.2-6 6.4-6.2 8.2 0 2.6 8.4 4.6 14 4.2 18.6-1 8.4-6.4 12.2-12.4 12.2S2.6 76 1.8 67.6C1.4 63 3.6 57.2 11 49Z" />
      <circle className="drop" style={{ ["--i" as string]: 2 }} cx="12.4" cy="73" r="1.5" />
      <path className="drop" style={{ ["--i" as string]: 3 }} d="M80.4 60.2c3.2-2.4 7.6-1.2 9.4 2.2 1.6 3 1.2 6.2-.6 8.2-2.2 2.4-5.6 3.2-8.6 2.2-3.2-1-5.4-4-4.6-7.4.6-2.4 2.2-4 4.4-5.2Z" />
      <path className="drop" style={{ ["--i" as string]: 4 }} d="M86.2 71.2c2.8-1.6 6.2-.4 7.6 2.2 1.2 2.4.6 5.2-1.2 6.6-2 1.6-4.8 1.6-6.8.2-2.2-1.6-2.8-4.4-1.6-6.8.8-1.2 1.4-1.8 2-2.2Z" />
      <path className="drop" style={{ ["--i" as string]: 5 }} d="M96.2 67.6c2.4-2.8 6.4-2.6 8.6.2 1.8 2.4 1.8 5.6.2 8-2 2.8-5.6 3.6-8.4 2-2.8-1.6-4-5-2.6-8 .8-1.6 1.6-2.2 2.2-2.2Z" />
      <ellipse className="drop" style={{ ["--i" as string]: 6 }} cx="49.2" cy="112.8" rx="6.6" ry="6.4" />
      <ellipse className="drop" style={{ ["--i" as string]: 7 }} cx="96" cy="145" rx="4.4" ry="4.2" />
      <path className="drop" style={{ ["--i" as string]: 8 }} d="M135 143.6c3.2-1.2 6.6.6 7.4 3.8.8 3.4-.6 6.6-3.4 8.2-3 1.6-6.6.6-8.2-2.4-1.6-3-.4-6.8 2-8.6.6-.4 1.4-.8 2.2-1Z" />
      <circle className="drop" style={{ ["--i" as string]: 0 }} cx="118" cy="8.4" r="3.6" />
    </svg>
  );
}

export function InfinityMark() {
  return (
    <svg className="mark mark-infinity" viewBox="0 0 64 32" aria-hidden="true">
      <path pathLength="100" d="M32 16C32 9 25 6 18 10c-6 3.4-8 10-4 14 4 4 10 2 14-2 4-4 10-6 14-2 5 5 2 12-4 14-7 4-14 1-14-6" />
    </svg>
  );
}

export function ParchmentMark() {
  return (
    <svg className="mark mark-scroll" viewBox="0 0 48 48" aria-hidden="true">
      <g className="scroll-paper">
        <path d="M14 16h20v16H14Z" />
        <path d="M16 20h16M16 24h12M16 28h14" className="scroll-lines" />
      </g>
      <g className="scroll-rods">
        <rect x="10" y="13" width="28" height="5" rx="2.5" />
        <rect x="10" y="30" width="28" height="5" rx="2.5" className="scroll-rod-bottom" />
      </g>
    </svg>
  );
}

export function SmileyMark() {
  return (
    <svg className="mark mark-smiley" viewBox="0 0 48 48" aria-hidden="true">
      <g className="face face-smile">
        <circle cx="24" cy="24" r="14" />
        <circle cx="18.5" cy="21" r="1.4" className="eye" />
        <circle cx="29.5" cy="21" r="1.4" className="eye" />
        <path d="M17.5 27.5c1.8 2.6 4 3.8 6.5 3.8s4.7-1.2 6.5-3.8" />
      </g>
      <g className="face face-wink">
        <circle cx="24" cy="24" r="14" />
        <path d="M16.2 21.2h4.6" />
        <circle cx="29.5" cy="21" r="1.4" className="eye" />
        <path d="M17.5 27.5c1.8 2.6 4 3.8 6.5 3.8s4.7-1.2 6.5-3.8" />
      </g>
      <g className="face face-grin">
        <circle cx="24" cy="24" r="14" />
        <circle cx="18.5" cy="20.5" r="1.4" className="eye" />
        <circle cx="29.5" cy="20.5" r="1.4" className="eye" />
        <path d="M16.5 26.5c2.2 4.2 5 6 7.5 6s5.3-1.8 7.5-6" />
        <path d="M21 31.2c.8 1.6 2 2.4 3 2.4s2.2-.8 3-2.4" className="tongue" />
      </g>
      <g className="face face-joy">
        <circle cx="24" cy="24" r="14" />
        <path d="M15.8 20.2c1.2-1.4 2.8-1.2 3.6.4M28.6 20.6c1.2-1.4 2.8-1.2 3.6.4" />
        <path d="M16.2 26.2c2.4 4.8 5.2 6.8 7.8 6.8s5.4-2 7.8-6.8" />
      </g>
    </svg>
  );
}
