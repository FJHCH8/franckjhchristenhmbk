"use client";

import { useEffect, useRef, useState } from "react";

const EMPTY = ["", "", "", "", "", ""];

/**
 * Le code d'accès à l'édition : six cases, une par chiffre, façon Windows Phone.
 * Utilisé dans les paramètres ; quand le code est bon, l'édition s'ouvre.
 */
export function CodeEdition({ onOk }: { onOk: () => void }) {
  const [digits, setDigits] = useState(EMPTY);
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxes = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const focus = window.setTimeout(() => boxes.current[0]?.focus(), 380);
    return () => window.clearTimeout(focus);
  }, []);

  const code = digits.join("");

  function write(next: string[]) {
    setDigits(next);
    setMessage("");
  }

  return (
      <form
        className={shake ? "code-edition is-error" : "code-edition"}
        aria-label="Code d'édition"
        onSubmit={async (event) => {
          event.preventDefault();
          if (code.length !== 6 || busy) return;
          setBusy(true);
          setMessage("");
          try {
            const response = await fetch("/api/edition/session", {
              method: "POST",
              credentials: "same-origin",
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
            onOk();
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
        <p className="code-edition-aide">Entre le code à six chiffres pour ouvrir l&apos;édition.</p>
        <div className="code-edition-cases">
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
        {message ? <p className="code-edition-erreur" role="alert">{message}</p> : null}
        <button type="submit" className="param-bouton" disabled={busy || code.length !== 6}>
          {busy ? "vérification…" : "entrer"}
        </button>
      </form>
  );
}
