export const THEME_STORAGE_KEY = "fjch-theme";

export type ThemeName = "clair" | "sombre";

export const themeInitScript = `(function(){try{localStorage.removeItem(${JSON.stringify(THEME_STORAGE_KEY)});}catch(e){}var d=document.documentElement;if(d.dataset.theme)delete d.dataset.theme;d.classList.add("js");var p=location.pathname;var page="etoile";if(p==="/qui-suis-je")page="qui-suis-je";else if(p==="/a-propos")page="a-propos";else if(p==="/contact")page="contact";else if(p==="/projets")page="projets";d.dataset.page=page;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#000000");try{var calme=matchMedia("(prefers-reduced-motion: reduce)").matches;if(!calme){d.classList.add("kt-on");setTimeout(function(){if(!window.__kt)d.classList.remove("kt-on");},4000);}var vue=calme;try{vue=vue||!!sessionStorage.getItem("fjch-intro");}catch(e){vue=true;}d.classList.add(vue?"intro-vue":"intro-joue");if(!vue)setTimeout(function(){d.classList.remove("intro-joue");},6500);}catch(e){d.classList.add("intro-vue");}})();`;

export function resolveInitialTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "clair" || stored === "sombre") return stored;
  } catch {
    /* private mode */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair";
}

export function applyThemeAttribute(theme: ThemeName) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "sombre" ? "#07091a" : "#8ebfe6");
}

export function persistTheme(theme: ThemeName) {
  applyThemeAttribute(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
  window.dispatchEvent(new Event("themechange"));
}
