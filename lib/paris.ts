function zonedToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string) {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(guess));
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
  return guess - (asUtc - guess);
}

export const PROJECTS_OPENING_MS = zonedToUtc(2026, 12, 1, 0, 0, "Europe/Paris");

/**
 * Début du compte à rebours, en heure de Paris.
 * null : cette date n'est pas dans le code. Ne pas la deviner.
 * Quand Franck la donne : zonedToUtc(année, mois, jour, heure, minute, "Europe/Paris").
 */
export const PROJECTS_START_MS: number | null = null;

export function countdownProgress(now: number, start: number | null = PROJECTS_START_MS, end = PROJECTS_OPENING_MS) {
  if (start == null || !(end > start)) return null;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

export function countdownParts(now: number, target = PROJECTS_OPENING_MS) {
  const left = Math.max(0, target - now);
  const seconds = Math.floor(left / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
    fraction: (left % 1000) / 1000,
    done: left <= 0,
  };
}
