"use client";

import { useEffect } from "react";

/** Protège une image une seule fois : réécrire l'attribut à chaque changement de la page coûtait très cher. */
function proteger(node: Element) {
  if (node.getAttribute("draggable") !== "false") node.setAttribute("draggable", "false");
}

function shield(root: ParentNode) {
  if (root instanceof Element && root.matches("img, video")) proteger(root);
  root.querySelectorAll("img, video").forEach(proteger);
}

export function ImageGuard() {
  useEffect(() => {
    const block = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("img, picture, video, .seal, .photo-field, .skin-field, .mark, .bebe-endur")) event.preventDefault();
    };
    shield(document);
    // Seulement les éléments ajoutés, et seulement s'ils contiennent des images.
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) shield(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      observer.disconnect();
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);
  return null;
}
