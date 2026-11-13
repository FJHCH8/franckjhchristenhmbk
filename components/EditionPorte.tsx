"use client";

import { useEffect, useState } from "react";

export function EditionPorte() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onAsk = () => {
      setOpen(true);
      setMessage("");
      setCode("");
    };
    window.addEventListener("fjch-edition", onAsk);
    return () => window.removeEventListener("fjch-edition", onAsk);
  }, []);

  if (!open) return null;

  return (
    <div className="edition-voile" role="presentation" onPointerDown={() => setOpen(false)}>
      <form
        className="edition-feuille"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edition-titre"
        onPointerDown={(event) => event.stopPropagation()}
        onSubmit={async (event) => {
          event.preventDefault();
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
              setMessage(data.erreur || "Ce code n’est pas accepté.");
              return;
            }
            setOpen(false);
            window.dispatchEvent(new CustomEvent("fjch-edition-ok", { detail: data.jeton }));
          } catch {
            setMessage("Le code n’a pas pu être vérifié.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 id="edition-titre">Code à six chiffres</h2>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          aria-label="Code à six chiffres"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <button type="submit" disabled={busy || code.length !== 6}>
          Entrer
        </button>
        {message ? <p role="alert">{message}</p> : null}
      </form>
    </div>
  );
}
