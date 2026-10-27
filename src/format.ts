export function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatPhone(value: string) {
  const d = digits(value).slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function formatCard(value: string) {
  const d = digits(value).slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value: string) {
  const d = digits(value).slice(0, 4);
  if (d.length < 3) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function ordinal(day: number) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function parseDate(iso: string) {
  return new Date(`${iso}T12:00:00`);
}

export function formatTimeLabel(time: string) {
  const [hRaw, mRaw] = time.split(":");
  const h = Number(hRaw);
  const suffix = h >= 12 ? "pm" : "am";
  const hr = h % 12 || 12;
  return `${hr}:${mRaw}${suffix}`;
}

export function formatTimeUpper(time: string) {
  const [hRaw, mRaw] = time.split(":");
  const h = Number(hRaw);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${mRaw} ${suffix}`;
}

export function formatBookingWhen(date: string, time: string) {
  const parsed = parseDate(date);
  const weekday = parsed.toLocaleDateString("en-US", { weekday: "long" });
  const month = parsed.toLocaleDateString("en-US", { month: "long" });
  const [hRaw, mRaw] = time.split(":");
  const h = Number(hRaw);
  const suffix = h >= 12 ? "pm" : "am";
  const hr = String(h % 12 || 12).padStart(2, "0");
  return `${weekday} ${ordinal(parsed.getDate())} ${month} at ${hr}:${mRaw}${suffix}`;
}

export function formatBirthdate(iso: string) {
  if (!iso) return "";
  const parsed = parseDate(iso);
  const month = parsed.toLocaleDateString("en-US", { month: "long" });
  return `${month} ${ordinal(parsed.getDate())}, ${parsed.getFullYear()}`;
}

export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addDays(iso: string, days: number) {
  const date = parseDate(iso);
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
