export const THEME_STORAGE_KEY = "fjch-theme";

export type ThemeName = "clair" | "sombre";

export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t!=="clair"&&t!=="sombre"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"sombre":"clair";}var d=document.documentElement;d.dataset.theme=t;d.classList.add("js");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="sombre"?"#07091a":"#8ebfe6");}catch(e){document.documentElement.dataset.theme="clair";document.documentElement.classList.add("js");}})();`;

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
