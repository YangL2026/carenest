export const TIME_BLOCKS = ["Morning", "Afternoon", "Evening"];

export function normalizeTime(t) {
  return t.slice(0, 5);
}

export function toTimeString(date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getTimeBlock(time) {
  const hour = Number.parseInt(time.split(":")[0], 10);

  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function getTimeRangeLabel(block) {
  if (block === "Morning") return "6:00 AM - 11:59 AM";
  if (block === "Afternoon") return "12:00 PM - 4:59 PM";
  return "5:00 PM - 11:59 PM";
}

export function formatTimeLabel(time) {
  const normalized = normalizeTime(time);
  const [hoursText, minutes] = normalized.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${hour12}:${minutes} ${suffix}`;
}

export function dateToIsoLocal(date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function hoursAgoText(isoDateTime, now = new Date()) {
  const elapsedMs = now.getTime() - new Date(isoDateTime).getTime();
  const hours = Math.max(1, Math.floor(elapsedMs / (60 * 60 * 1000)));
  return `${hours}hrs ago`;
}
