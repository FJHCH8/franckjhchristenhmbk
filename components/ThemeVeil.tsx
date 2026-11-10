function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function holdPreviousTheme(origin: HTMLElement | null) {
  const previous = document.querySelector<HTMLCanvasElement>(".theme-veil");
  previous?.remove();
  const night = document.documentElement.dataset.theme === "sombre";
  const page = document.documentElement.dataset.page;
  const qui = page === "qui-suis-je" ? document.querySelector<HTMLCanvasElement>(".qui-sea canvas") : null;
  const projets = page === "projets" ? document.querySelector<HTMLCanvasElement>(".projets-sky canvas") : null;
  const sky = document.querySelector<HTMLCanvasElement>(".sky canvas");
  const rain = document.querySelector<HTMLCanvasElement>(".rain-layer");
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (width < 2 || height < 2) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const veil = document.createElement("canvas");
  veil.className = "theme-veil";
  veil.width = Math.round(width * dpr);
  veil.height = Math.round(height * dpr);
  const ctx = veil.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (projets && projets.width > 0) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(projets, 0, 0, width, height);
  } else if (qui && qui.width > 0) {
    ctx.drawImage(qui, 0, 0, width, height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (night) {
      gradient.addColorStop(0, "#050714");
      gradient.addColorStop(0.48, "#0c1228");
      gradient.addColorStop(1, "#171e38");
    } else {
      gradient.addColorStop(0, "#6eafdf");
      gradient.addColorStop(0.32, "#97cdee");
      gradient.addColorStop(0.68, "#c5e4f6");
      gradient.addColorStop(1, "#e7f4fb");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    if (sky && sky.width > 0) ctx.drawImage(sky, 0, 0, width, height);
    if (rain && rain.width > 0) ctx.drawImage(rain, 0, 0, width, height);
  }
  const box = origin?.getBoundingClientRect();
  const x = box ? box.left + box.width / 2 : width - 72;
  const y = box ? box.top + box.height / 2 : 36;
  const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) + 24;
  veil.style.setProperty("--theme-x", `${x}px`);
  veil.style.setProperty("--theme-y", `${y}px`);
  veil.style.setProperty("--reveal", "0px");
  document.body.appendChild(veil);
  const start = performance.now();
  const duration = 1080;
  const tick = (now: number) => {
    if (!veil.isConnected) return;
    const t = Math.min(1, (now - start) / duration);
    veil.style.setProperty("--reveal", `${ease(t) * radius}px`);
    if (t < 1) requestAnimationFrame(tick);
    else veil.remove();
  };
  requestAnimationFrame(tick);
}
