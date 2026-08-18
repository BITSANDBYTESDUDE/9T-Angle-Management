export function startOfDay(value: Date | string = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}
export function endOfDay(value: Date | string = new Date()) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}
export function startOfWeek(value: Date | string = new Date()) {
  const date = startOfDay(value);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
}
export function startOfMonth(value: Date | string = new Date()) {
  const date = startOfDay(value);
  date.setDate(1);
  return date;
}
export function hoursBetween(start?: Date, end?: Date) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round(((end.getTime() - start.getTime()) / 36e5) * 100) / 100);
}
