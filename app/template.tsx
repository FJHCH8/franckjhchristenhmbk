import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="page-enter">
      <div className="page-veil" aria-hidden="true" />
      {children}
    </div>
  );
}
