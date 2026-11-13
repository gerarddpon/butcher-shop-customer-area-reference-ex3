export const SLOT_CAPACITY = 4;
export const PICKUP_TIMES = [
  "09h30 – 10h00",
  "10h00 – 10h30",
  "11h00 – 11h30",
  "12h30 – 13h00",
  "14h00 – 14h30",
  "15h00 – 15h30",
  "16h00 – 16h30",
];

const shortWeekdays = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const shortMonths = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export function toUtcDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

export function addDays(value: string, days: number) {
  const date = toUtcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dayInfo(value: string) {
  const date = toUtcDate(value);
  const weekday = date.getUTCDay();
  return {
    date: value,
    dayNumber: date.getUTCDate(),
    dayLabel: shortWeekdays[weekday],
    monthLabel: shortMonths[date.getUTCMonth()],
    closed: weekday === 0 || weekday === 1,
    weekday,
  };
}

export function pickupDays(startDate: string, count = 7) {
  return Array.from({ length: count }, (_, index) => dayInfo(addDays(startDate, index + 1)));
}

export function slotIsReserved(label: string) {
  return label === "12h30 – 13h00";
}

export function slotCountKey(date: string, label: string) {
  return `${date}|${label}`;
}

export function previousDayDeadline(date: string) {
  return `${addDays(date, -1)}T22:00:00`;
}
