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
  return <span className="mark mark-infini" aria-hidden="true" />;
}

export function ParchmentMark() {
  return <span className="mark mark-parchemin" aria-hidden="true" />;
}

export function SmileyMark() {
  return <span className="mark mark-sourire" aria-hidden="true" />;
}
