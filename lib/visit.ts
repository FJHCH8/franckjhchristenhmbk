/** Session flags. They last for this tab visit and clear when the tab closes. */

export const VISIT_RAINBOW = "fjch-visit-rainbow";
export const VISIT_AURORA = "fjch-visit-aurora";

export function visitHas(key: string) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function visitSet(key: string) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* private mode */
  }
}
