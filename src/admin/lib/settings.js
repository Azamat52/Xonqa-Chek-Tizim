// Shaxsiy sozlamalar: standart qiymatlar, tekshiruv va mavzuni qo'llash.
export const SETTINGS_KEY = "xonqa-pos-settings";

export const DEFAULT_SETTINGS = Object.freeze({
  theme: "light",
  notifications: true,
  sound: true,
  volume: 70,
  notificationDuration: 8,
  compact: false,
});

export function normalizeSettings(value) {
  const input = value && typeof value === "object" ? value : {};
  const bool = (key) => (typeof input[key] === "boolean" ? input[key] : DEFAULT_SETTINGS[key]);
  const volume = Number.isFinite(input.volume) ? Math.min(100, Math.max(0, input.volume)) : 70;

  return {
    theme: ["dark", "light", "system"].includes(input.theme) ? input.theme : DEFAULT_SETTINGS.theme,
    notifications: bool("notifications"),
    sound: bool("sound"),
    volume,
    notificationDuration: [5, 8, 15].includes(input.notificationDuration)
      ? input.notificationDuration
      : DEFAULT_SETTINGS.notificationDuration,
    compact: bool("compact"),
  };
}

export function loadSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null"));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function persistSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // saqlash ixtiyoriy
  }
}

/** HTML ga dark/light klassini va zichlikni qo'yadi. */
export function applySettings(settings, systemDark) {
  const resolved = settings.theme === "system" ? (systemDark ? "dark" : "light") : settings.theme;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.style.colorScheme = resolved;
  root.dataset.density = settings.compact ? "compact" : "comfortable";
}
