"use client";

import { useEffect } from "react";

function shield(root: ParentNode) {
  root.querySelectorAll("img, video").forEach((node) => {
    if (node instanceof HTMLImageElement || node instanceof HTMLVideoElement) node.draggable = false;
    node.setAttribute("draggable", "false");
  });
}

export function ImageGuard() {
  useEffect(() => {
    const block = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("img, picture, video, .seal, .photo-field, .skin-field, .mark, .bebe-endur")) event.preventDefault();
    };
    shield(document);
    const observer = new MutationObserver(() => shield(document));
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
