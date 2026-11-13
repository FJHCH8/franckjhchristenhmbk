"use client";

import { useEffect, useRef, useState } from "react";

const EMPTY = ["", "", "", "", "", ""];

export function EditionPorte() {
  const [open, setOpen] = useState(false);
  const [digits, setDigits] = useState(EMPTY);
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxes = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const onAsk = () => {
      setOpen(true);
      setMessage("");
      setDigits(EMPTY);
      setShake(false);
    };
    window.addEventListener("fjch-edition", onAsk);
    return () => window.removeEventListener("fjch-edition", onAsk);
  }, []);

  useEffect(() => {
    if (!open) return;
    const focus = window.setTimeout(() => boxes.current[0]?.focus(), 40);
    return () => window.clearTimeout(focus);
  }, [open]);

  if (!open) return null;

  const code = digits.join("");

  function write(next: string[]) {
    setDigits(next);
    setMessage("");
  }

  return (
    <div className={shake ? "edition-voile is-error" : "edition-voile"} role="presentation">
      <form
        className="edition-code"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edition-titre"
        onSubmit={async (event) => {
          event.preventDefault();
          if (code.length !== 6 || busy) return;
          setBusy(true);
          setMessage("");
          try {
            const response = await fetch("/api/edition/session", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ code }),
            });
            const data = (await response.json()) as { ok?: boolean; jeton?: string; erreur?: string };
            if (!response.ok || !data.ok || !data.jeton) {
              setShake(true);
              setMessage(data.erreur || "Ce code n’est pas accepté.");
              window.setTimeout(() => setShake(false), 520);
              return;
            }
            setOpen(false);
            window.dispatchEvent(new CustomEvent("fjch-edition-ok", { detail: data.jeton }));
          } catch {
            setShake(true);
            setMessage("Le code n’a pas pu être vérifié.");
            window.setTimeout(() => setShake(false), 520);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="edition-kicker">Édition</p>
        <h2 id="edition-titre">Code à six chiffres</h2>
        <div className="code-cases">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                boxes.current[index] = node;
              }}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={index === 0 ? 6 : 1}
              aria-label={`Chiffre ${index + 1}`}
              value={digit}
              onChange={(event) => {
                const raw = event.target.value.replace(/\D/g, "");
                if (raw.length > 1) {
                  const next = EMPTY.map((_, place) => raw[place] ?? "");
                  write(next);
                  boxes.current[Math.min(5, raw.length)]?.focus();
                  return;
                }
                const next = [...digits];
                next[index] = raw;
                write(next);
                if (raw && index < 5) boxes.current[index + 1]?.focus();
              }}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !digits[index] && index > 0) boxes.current[index - 1]?.focus();
              }}
              onPaste={(event) => {
                const raw = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                if (!raw) return;
                event.preventDefault();
                write(EMPTY.map((_, place) => raw[place] ?? ""));
                boxes.current[Math.min(5, raw.length)]?.focus();
              }}
            />
          ))}
        </div>
        <button type="submit" disabled={busy || code.length !== 6}>
          Entrer
        </button>
        {message ? <p role="alert">{message}</p> : null}
      </form>
    </div>
  );
}
