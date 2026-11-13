export function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function asDate(value: string) {
  return new Date(value.length === 10 ? `${value}T12:00:00.000Z` : value);
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(asDate(value));
}

export function formatDateLong(value: string) {
  return formatDate(value, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(asDate(value));
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("résolu") || normalized.includes("livrée") || normalized.includes("retirée") || normalized.includes("réglée") || normalized.includes("publié") || normalized.includes("actif")) return "status-green";
  if (normalized.includes("analyse") || normalized.includes("pesée") || normalized.includes("attente")) return "status-gold";
  if (normalized.includes("annul") || normalized.includes("refus")) return "status-red";
  if (normalized.includes("confirm")) return "status-blue";
  return "status-burgundy";
}
