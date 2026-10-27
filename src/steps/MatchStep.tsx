import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import {
  ALL_PROVIDERS,
  CLINICIAN_BACKGROUNDS,
  CLINICIAN_LANGUAGES,
  CONDITIONS,
  findProvider,
  findSlot,
  timeBand,
} from "../data";
import { addDays, formatBookingWhen, formatTimeUpper, parseDate, todayISO } from "../format";
import { useDialogs, useOnboarding } from "../state";
import type { BandCounts, DayPart, OnboardingData, Provider, ProviderGender, ScheduleAsk } from "../types";
import { IntroVideo } from "../components/IntroVideo";
import { PrimaryButton } from "../components/ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PARTS: { id: DayPart; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
];
const GENDERS: { id: ProviderGender; label: string }[] = [
  { id: "woman", label: "Women" },
  { id: "man", label: "Men" },
  { id: "nonbinary", label: "Non-binary clinicians" },
];

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function sundayOf(iso: string) {
  const date = parseDate(iso);
  date.setDate(date.getDate() - date.getDay());
  return isoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function earliestOpening(data: OnboardingData) {
  const today = todayISO();
  const horizon = addDays(today, 45);
  let best: string | null = null;
  for (const provider of ALL_PROVIDERS) {
    if (!matchesPrefs(provider, data)) continue;
    for (const slot of provider.slots) {
      if (slot.date < today || slot.date > horizon) continue;
      if (!best || slot.date < best) best = slot.date;
    }
  }
  return best ?? today;
}

function choiceClass(selected: boolean) {
  return `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
    selected ? "border-2 border-[#0B6B3A] bg-[#E8F7EE]" : "border border-slate-200 bg-white"
  }`;
}

function emptyCounts(): BandCounts {
  return { morning: 0, afternoon: 0, evening: 0 };
}

function matchesPrefs(provider: Provider, data: OnboardingData) {
  if (data.genderPrefs.length > 0 && !data.genderPrefs.includes(provider.gender)) return false;
  if (data.languagePrefs.length > 0 && !data.languagePrefs.some((language) => provider.languages.includes(language))) {
    return false;
  }
  if (
    data.backgroundPrefs.length > 0 &&
    !data.backgroundPrefs.some((background) => provider.backgrounds.includes(background))
  ) {
    return false;
  }
  return true;
}

function countBands(date: string | null, data: OnboardingData, through: string | null): BandCounts {
  const counts = emptyCounts();
  const today = todayISO();
  for (const provider of ALL_PROVIDERS) {
    if (!matchesPrefs(provider, data)) continue;
    for (const slot of provider.slots) {
      if (slot.date < today) continue;
      if (date && slot.date !== date) continue;
      if (through && slot.date > through) continue;
      counts[timeBand(slot.time)] += 1;
    }
  }
  return counts;
}

function timeOffered(date: string | null, time: string | null, prefsData: OnboardingData) {
  if (!date || !time || !prefsData.timeOfDay) return false;
  if (timeBand(time) !== prefsData.timeOfDay) return false;
  return ALL_PROVIDERS.some(
    (provider) =>
      matchesPrefs(provider, prefsData) && provider.slots.some((slot) => slot.date === date && slot.time === time),
  );
}

function slotAt(provider: Provider, date: string, time: string, prefsData: OnboardingData) {
  if (!matchesPrefs(provider, prefsData) || !prefsData.timeOfDay || timeBand(time) !== prefsData.timeOfDay) return null;
  return provider.slots.find((slot) => slot.date === date && slot.time === time) ?? null;
}

function conditionLabels(ids: string[]) {
  return ids.flatMap((id) => {
    const label = CONDITIONS.find((item) => item.id === id)?.label;
    return label && id !== "unsure" && id !== "private" ? [label] : [];
  });
}

function preferenceSummary(data: OnboardingData) {
  const parts: string[] = [];
  if (data.genderPrefs.length) {
    parts.push(data.genderPrefs.map((gender) => GENDERS.find((item) => item.id === gender)?.label ?? gender).join(" or "));
  }
  if (data.languagePrefs.length) parts.push(data.languagePrefs.join(" or "));
  if (data.backgroundPrefs.length) parts.push(data.backgroundPrefs.join(" or "));
  return parts.join("; ");
}

export function MatchStep() {
  const { data, patch, recordSchedule } = useOnboarding();
  const { openHelp } = useDialogs();
  const [othersOpen, setOthersOpen] = useState(false);
  const [nearbyNote, setNearbyNote] = useState("");
  const [timesHelp, setTimesHelp] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefsInfo, setPrefsInfo] = useState(false);
  const [pending, setPending] = useState<{ providerId: string; slotId: string } | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [readMoreId, setReadMoreId] = useState<string | null>(null);
  const [clockTime, setClockTime] = useState<string | null>(() => {
    const provider = findProvider(data.providerId);
    const slot = provider ? findSlot(provider, data.slotId) : null;
    if (!slot || slot.date !== data.preferredDate) return null;
    if (data.timeOfDay && timeBand(slot.time) !== data.timeOfDay) return null;
    return slot.time;
  });
  const [weekStart, setWeekStart] = useState(() => sundayOf(data.preferredDate || earliestOpening(data)));
  const [monthCursor, setMonthCursor] = useState(() => {
    const source = parseDate(data.preferredDate || earliestOpening(data));
    return { year: source.getFullYear(), month: source.getMonth() };
  });

  useEffect(() => {
    if (!prefsOpen && !calendarOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setPrefsOpen(false);
      setCalendarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prefsOpen, calendarOpen]);

  const band = data.timeOfDay;
  const horizon = addDays(todayISO(), 45);
  const onDay = data.preferredDate ? countBands(data.preferredDate, data, null) : null;
  const inNext45Days = countBands(null, data, horizon);
  const prefs = preferenceSummary(data);

  const browseProviderId = data.rescheduling ? (pending?.providerId ?? null) : data.providerId;
  const browseSlotId = data.rescheduling ? (pending?.slotId ?? null) : data.slotId;
  const timeOptions = useMemo(() => {
    if (!band || !data.preferredDate) return [];
    const times = new Set<string>();
    for (const provider of ALL_PROVIDERS) {
      if (!matchesPrefs(provider, data)) continue;
      for (const slot of provider.slots) {
        if (slot.date === data.preferredDate && timeBand(slot.time) === band) times.add(slot.time);
      }
    }
    return [...times].sort();
  }, [band, data]);
  const clinicians = useMemo(() => {
    if (!data.preferredDate || !clockTime || !band) return [];
    const labels = conditionLabels(data.conditions);
    return ALL_PROVIDERS.flatMap((provider) => {
      const slot = slotAt(provider, data.preferredDate as string, clockTime, data);
      return slot ? [{ provider, slot }] : [];
    }).sort((a, b) => {
      const overlap = (provider: Provider) =>
        provider.expertise.filter((item) => labels.some((label) => label === item)).length;
      return overlap(b.provider) - overlap(a.provider) || a.provider.name.localeCompare(b.provider.name);
    });
  }, [band, clockTime, data]);
  const selectedEntry = clinicians.find((item) => item.provider.id === browseProviderId && item.slot.id === browseSlotId) ?? null;
  const orderedClinicians = selectedEntry
    ? [selectedEntry, ...clinicians.filter((item) => item.provider.id !== selectedEntry.provider.id)]
    : clinicians;
  const firstClinician = orderedClinicians[0] ?? null;
  const otherClinicians = orderedClinicians.slice(1);
  const bookedProvider = data.rescheduling ? findProvider(data.providerId) : null;
  const bookedSlot = bookedProvider ? findSlot(bookedProvider, data.slotId) : null;
  const slotsInRequest = data.preferredDate ? (onDay && band ? onDay[band] : 0) : band ? inNext45Days[band] : 0;

  function snapshot(result: ScheduleAsk["result"]): Omit<ScheduleAsk, "id" | "at"> | null {
    if (!band) return null;
    return {
      date: data.preferredDate,
      timeOfDay: band,
      genders: data.genderPrefs,
      onDay,
      inNext45Days,
      slotsInRequest,
      result,
    };
  }

  function remember(result: ScheduleAsk["result"]) {
    const ask = snapshot(result);
    if (ask) recordSchedule(ask);
  }

  function toggleList(current: string[], value: string) {
    return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  }

  function clearSelection() {
    setOthersOpen(false);
    setNearbyNote("");
    setTimesHelp(false);
    setPending(null);
  }

  function showWeek(iso: string) {
    const start = sundayOf(iso);
    setWeekStart(start);
    const when = parseDate(iso);
    setMonthCursor({ year: when.getFullYear(), month: when.getMonth() });
  }

  function applySearch(partial: Partial<OnboardingData>, nextClock: string | null) {
    const next = { ...data, ...partial };
    const time = timeOffered(next.preferredDate, nextClock, next) ? nextClock : null;
    setClockTime(time);
    const currentId = data.rescheduling ? pending?.providerId ?? null : data.providerId;
    const provider = currentId ? findProvider(currentId) : null;
    const slot = provider && time && next.preferredDate ? slotAt(provider, next.preferredDate, time, next) : null;
    if (data.rescheduling) {
      setPending(slot && provider ? { providerId: provider.id, slotId: slot.id } : null);
      const { providerId: _providerId, slotId: _slotId, ...rest } = partial;
      patch({ ...rest, banner: "" });
      return;
    }
    patch({
      ...partial,
      providerId: slot && provider ? provider.id : null,
      slotId: slot ? slot.id : null,
      banner: "",
    });
  }

  function chooseClinician(providerId: string, slotId: string) {
    if (data.rescheduling) {
      setPending({ providerId, slotId });
      return;
    }
    patch({ providerId, slotId, banner: "" });
  }

  function applySoonest() {
    clearSelection();
    let best: { date: string; time: string } | null = null;
    for (const provider of ALL_PROVIDERS) {
      if (!matchesPrefs(provider, data)) continue;
      for (const slot of provider.slots) {
        if (slot.date < todayISO() || slot.date > horizon) continue;
        if (band && timeBand(slot.time) !== band) continue;
        if (!best || `${slot.date}${slot.time}` < `${best.date}${best.time}`) best = slot;
      }
    }
    if (!best) {
      applySearch({ preferredDate: null }, null);
      setNearbyNote(
        band
          ? `No ${band} opening matches the preferences you already set. Those preferences are still on.`
          : "No opening matches the preferences you already set. Those preferences are still on.",
      );
      return;
    }
    showWeek(best.date);
    applySearch({ preferredDate: best.date }, null);
  }

  function tryNearby() {
    if (!band) return;
    const anchor = data.preferredDate ?? todayISO();
    let found: string | null = null;
    for (let offset = 1; offset <= 45 && !found; offset += 1) {
      const forward = addDays(anchor, offset);
      if (forward <= horizon && countBands(forward, data, null)[band] > 0) found = forward;
    }
    for (let offset = 1; offset <= 21 && !found; offset += 1) {
      const back = addDays(anchor, -offset);
      if (back >= todayISO() && countBands(back, data, null)[band] > 0) found = back;
    }
    remember("nearby");
    if (!found) {
      setNearbyNote(`No other ${band} day matches what you entered. Your ${band} choice is still saved.`);
      return;
    }
    showWeek(found);
    applySearch({ preferredDate: found }, clockTime);
    const when = parseDate(found);
    setNearbyNote(
      `Moved to ${when.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}. ${band[0].toUpperCase()}${band.slice(1)} times are shown for that day.`,
    );
  }

  const today = todayISO();
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const firstOfMonth = new Date(monthCursor.year, monthCursor.month, 1);
  const daysInMonth = new Date(monthCursor.year, monthCursor.month + 1, 0).getDate();
  const startPad = firstOfMonth.getDay();
  const monthLabel = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const openDates = useMemo(() => {
    const dates = new Set<string>();
    for (const provider of ALL_PROVIDERS) {
      if (!matchesPrefs(provider, data)) continue;
      for (const slot of provider.slots) {
        if (slot.date >= today && (!band || timeBand(slot.time) === band)) dates.add(slot.date);
      }
    }
    return dates;
  }, [band, data, today]);
  const selectedDateLabel = data.preferredDate
    ? parseDate(data.preferredDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";
  const chips: { kind: "gender" | "language" | "experience"; id: string; label: string }[] = [
    ...data.genderPrefs.map((id) => ({
      kind: "gender" as const,
      id,
      label: GENDERS.find((item) => item.id === id)?.label ?? id,
    })),
    ...data.languagePrefs.map((id) => ({ kind: "language" as const, id, label: id })),
    ...data.backgroundPrefs.map((id) => ({ kind: "experience" as const, id, label: id })),
  ];

  function shiftWeek(delta: number) {
    const next = addDays(weekStart, delta * 7);
    if (next < sundayOf(today) || next > sundayOf(horizon)) return;
    setWeekStart(next);
  }

  function shiftMonth(delta: number) {
    setMonthCursor((current) => {
      const date = new Date(current.year, current.month + delta, 1);
      const earliest = parseDate(today);
      const latest = parseDate(horizon);
      if (date < new Date(earliest.getFullYear(), earliest.getMonth(), 1)) return current;
      if (date > new Date(latest.getFullYear(), latest.getMonth(), 1)) return current;
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  function selectDay(iso: string) {
    showWeek(iso);
    setCalendarOpen(false);
    applySearch({ preferredDate: iso }, clockTime);
  }

  function removeChip(kind: "gender" | "language" | "experience", id: string) {
    if (kind === "gender") {
      applySearch({ genderPrefs: data.genderPrefs.filter((item) => item !== id) }, clockTime);
    } else if (kind === "language") {
      applySearch({ languagePrefs: data.languagePrefs.filter((item) => item !== id) }, clockTime);
    } else {
      applySearch({ backgroundPrefs: data.backgroundPrefs.filter((item) => item !== id) }, clockTime);
    }
  }

  function confirmTime() {
    if (!selectedEntry) return;
    if (data.rescheduling) {
      patch({
        providerId: selectedEntry.provider.id,
        slotId: selectedEntry.slot.id,
        preferredDate: selectedEntry.slot.date,
        timeOfDay: timeBand(selectedEntry.slot.time),
        rescheduling: false,
        visitPhase: "upcoming",
        visitDay: false,
        connectionProblem: false,
        awayFromVisit: false,
        banner: "",
      });
      return;
    }
    remember("booked");
    patch({
      providerId: selectedEntry.provider.id,
      slotId: selectedEntry.slot.id,
      preferredDate: selectedEntry.slot.date,
      timeOfDay: timeBand(selectedEntry.slot.time),
      step: 2,
      banner: "",
    });
  }

  const continueLabel = data.rescheduling ? "Switch to this time" : "Continue";

  return (
    <div>
      <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Find a time that works for you</h1>
          <p className="mt-1 text-sm text-slate-600">All appointment times are shown in Central Time.</p>
          {data.rescheduling && bookedProvider && bookedSlot ? (
            <p className="mt-2 text-sm text-slate-700">
              Current appointment: {formatBookingWhen(bookedSlot.date, bookedSlot.time)} Central Time with {bookedProvider.name}. It stays until you switch.{" "}
              <button type="button" className="font-semibold text-brand underline" onClick={() => patch({ rescheduling: false, banner: "" })}>
                Keep my current appointment
              </button>
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#E6EEF6] px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Clinician preferences · Optional</p>
            {chips.map((chip) => (
              <button
                key={`${chip.kind}-${chip.id}`}
                type="button"
                onClick={() => removeChip(chip.kind, chip.id)}
                aria-label={`Remove ${chip.label}`}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-[#0B6B3A] bg-[#E8F7EE] px-2 text-xs font-medium text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {chip.label}
                <X size={12} aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              aria-expanded={prefsOpen}
              onClick={() => {
                setCalendarOpen(false);
                setPrefsOpen(true);
              }}
              className="ml-auto inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Edit
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={!data.preferredDate}
              onClick={applySoonest}
              className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${choiceClass(!data.preferredDate)}`}
            >
              {!data.preferredDate ? <Check size={14} aria-hidden="true" /> : null}
              Soonest available
            </button>
            <button
              type="button"
              aria-expanded={calendarOpen}
              onClick={() => {
                setPrefsOpen(false);
                setCalendarOpen((open) => !open);
              }}
              className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Choose another date
            </button>
          </div>

          {prefsOpen ? (
            <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={() => setPrefsOpen(false)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Clinician preferences"
                className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-2xl bg-white p-5 shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[400px] sm:rounded-none"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Clinician preferences · Optional</h2>
                    <p className="mt-1 text-sm text-slate-600">Choose any preferences that matter to you.</p>
                  </div>
                  <button
                    type="button"
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    onClick={() => setPrefsOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  aria-expanded={prefsInfo}
                  onClick={() => setPrefsInfo((open) => !open)}
                >
                  <Info size={14} aria-hidden="true" />
                  Where this comes from
                </button>
                {prefsInfo ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    These use what each clinician listed on their profile. A name or photo is not used to decide.
                  </p>
                ) : null}
                <PreferenceGroup
                  legend="Gender"
                  options={GENDERS.map((item) => ({ id: item.id, label: item.label }))}
                  selected={data.genderPrefs}
                  onToggle={(id) =>
                    applySearch({ genderPrefs: toggleList(data.genderPrefs, id) as ProviderGender[] }, clockTime)
                  }
                />
                <PreferenceGroup
                  legend="Language"
                  options={CLINICIAN_LANGUAGES.map((language) => ({ id: language, label: language }))}
                  selected={data.languagePrefs}
                  onToggle={(id) => applySearch({ languagePrefs: toggleList(data.languagePrefs, id) }, clockTime)}
                />
                <PreferenceGroup
                  legend="Care experience"
                  options={CLINICIAN_BACKGROUNDS.map((background) => ({ id: background, label: background }))}
                  selected={data.backgroundPrefs}
                  onToggle={(id) => applySearch({ backgroundPrefs: toggleList(data.backgroundPrefs, id) }, clockTime)}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Previous week"
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={() => shiftWeek(-1)}
              >
                <ChevronLeft size={16} />
              </button>
              <p className="text-sm font-semibold text-slate-900">
                Week of{" "}
                {parseDate(weekStart).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </p>
              <button
                type="button"
                aria-label="Next week"
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={() => shiftWeek(1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {weekDays.map((iso) => {
                const when = parseDate(iso);
                const selectable = iso >= today && iso <= horizon;
                const hasOpening = openDates.has(iso);
                const selectedDay = data.preferredDate === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={!selectable}
                    aria-pressed={selectedDay}
                    aria-label={`${when.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, ${
                      hasOpening ? "openings available" : "no openings"
                    }`}
                    onClick={() => selectDay(iso)}
                    className={`relative flex h-[4.75rem] flex-col items-center justify-center rounded-lg text-sm disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      selectedDay
                        ? "border-2 border-[#0B6B3A] bg-[#E8F7EE] text-slate-900"
                        : hasOpening
                          ? "border border-slate-200 bg-white text-slate-900"
                          : "border border-dashed border-slate-300 bg-white text-slate-600"
                    }`}
                  >
                    {selectedDay ? <Check size={12} className="absolute right-1 top-1" aria-hidden="true" /> : null}
                    <span className="text-[11px] font-medium">{WEEKDAYS[when.getDay()]}</span>
                    <span className="text-base font-semibold leading-none">{when.getDate()}</span>
                    <span className="text-[10px]">{selectable ? (hasOpening ? "Open" : "None") : ""}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {calendarOpen ? (
            <div
              className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/30 px-4 pt-16 sm:pt-24"
              onClick={() => setCalendarOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Choose a date"
                className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Choose a date</p>
                <button
                  type="button"
                  className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  onClick={() => setCalendarOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous month"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  onClick={() => shiftMonth(-1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <p className="text-sm font-semibold text-slate-900">{monthLabel}</p>
                <button
                  type="button"
                  aria-label="Next month"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  onClick={() => shiftMonth(1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
                {WEEKDAYS.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {Array.from({ length: startPad }, (_, pad) => (
                  <div key={`pad-${pad}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                  const day = dayIndex + 1;
                  const iso = isoDate(monthCursor.year, monthCursor.month, day);
                  const selectable = iso >= today && iso <= horizon;
                  const hasOpening = openDates.has(iso);
                  const selectedDay = data.preferredDate === iso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={!selectable}
                      aria-pressed={selectedDay}
                      onClick={() => selectDay(iso)}
                      className={`relative h-10 rounded-lg text-sm disabled:cursor-not-allowed disabled:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                        selectedDay
                          ? "border-2 border-[#0B6B3A] bg-[#E8F7EE] font-semibold text-slate-900"
                          : !selectable
                            ? "text-slate-300"
                            : hasOpening
                              ? "border border-slate-200 font-medium text-slate-900"
                              : "border border-dashed border-slate-300 text-slate-500"
                      }`}
                    >
                      {selectedDay ? <Check size={10} className="absolute right-0.5 top-0.5" aria-hidden="true" /> : null}
                      {day}
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
          ) : null}

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-slate-900">Time of day</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PARTS.map((part) => {
                const on = band === part.id;
                return (
                  <button
                    key={part.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => applySearch({ timeOfDay: part.id }, clockTime)}
                    className={`inline-flex h-12 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-slate-900 ${choiceClass(on)}`}
                  >
                    {on ? <Check size={14} aria-hidden="true" /> : null}
                    {part.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6">
            {!data.preferredDate ? (
              <p className="text-sm text-slate-600">Choose a day to see times.</p>
            ) : !band ? (
              <>
                <p className="text-sm font-semibold text-slate-900">{selectedDateLabel}</p>
                <p className="mt-1 text-sm text-slate-600">Choose morning, afternoon, or evening to see times.</p>
              </>
            ) : timeOptions.length > 0 ? (
              <>
                <p className="text-sm font-semibold text-slate-900">{selectedDateLabel}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {timeOptions.map((time) => {
                    const active = clockTime === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        aria-pressed={active}
                        onClick={() => applySearch({}, time)}
                        className={`relative inline-flex h-14 items-center justify-center gap-1.5 rounded-lg text-base font-semibold text-slate-900 ${choiceClass(active)}`}
                      >
                        {active ? <Check size={14} aria-hidden="true" /> : null}
                        {formatTimeUpper(time)}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="mt-2 text-sm font-semibold text-brand underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  aria-expanded={timesHelp}
                  onClick={() => setTimesHelp((open) => !open)}
                >
                  These times don't work?
                </button>
                {timesHelp ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={tryNearby} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800">
                      Find the next matching day
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        remember("help");
                        openHelp();
                      }}
                      className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800"
                    >
                      Get help booking
                    </button>
                  </div>
                ) : null}
                {nearbyNote ? <p className="mt-2 text-sm text-slate-700">{nearbyNote}</p> : null}
              </>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedDateLabel}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">No matching {band} openings</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {prefs
                    ? `Nothing is open for ${band} on this day with ${prefs}. Those preferences stay until you change them.`
                    : `Nothing is open for ${band} on this day. Your ${band} choice is saved.`}
                </p>
                {nearbyNote ? <p className="mt-2 text-sm text-slate-800">{nearbyNote}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={tryNearby} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800">
                    Find the next matching day
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      remember("help");
                      openHelp();
                    }}
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800"
                  >
                    Get help booking
                  </button>
                </div>
              </div>
            )}
          </div>

          {clockTime ? (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">Available at {formatTimeUpper(clockTime)}</h2>
              {firstClinician ? (
                <div className="mt-3 space-y-4">
                  <ClinicianCard
                    provider={firstClinician.provider}
                    selected={selectedEntry?.provider.id === firstClinician.provider.id}
                    expanded={readMoreId === firstClinician.provider.id}
                    data={data}
                    onToggleAbout={() =>
                      setReadMoreId((current) => (current === firstClinician.provider.id ? null : firstClinician.provider.id))
                    }
                    onChoose={() => chooseClinician(firstClinician.provider.id, firstClinician.slot.id)}
                  />
                  {otherClinicians.length > 0 ? (
                    <>
                      <button
                        type="button"
                        aria-expanded={othersOpen}
                        onClick={() => setOthersOpen((open) => !open)}
                        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        Show other available clinicians
                      </button>
                      {othersOpen
                        ? otherClinicians.map((item) => (
                            <ClinicianCard
                              key={item.provider.id}
                              provider={item.provider}
                              selected={selectedEntry?.provider.id === item.provider.id}
                              expanded={readMoreId === item.provider.id}
                              data={data}
                              onToggleAbout={() =>
                                setReadMoreId((current) => (current === item.provider.id ? null : item.provider.id))
                              }
                              onChoose={() => chooseClinician(item.provider.id, item.slot.id)}
                            />
                          ))
                        : null}
                    </>
                  ) : (
                    <p className="text-sm leading-relaxed text-slate-600">
                      Nobody else is available at this time. You can choose a different time or edit your preferences.
                    </p>
                  )}
                  {selectedEntry ? (
                    <div className="pt-2">
                      <PrimaryButton onClick={confirmTime}>{continueLabel}</PrimaryButton>
                      <p className="mt-2 text-center text-xs text-slate-500">You'll review the details before booking.</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-700">Choose a clinician for this time.</p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-700">Choose a time to see who is available.</p>
              )}
            </section>
          ) : band && data.preferredDate && timeOptions.length > 0 ? (
            <p className="mt-6 text-sm text-slate-700">Choose a time to see who is available.</p>
          ) : null}
        </div>
    </div>
  );
}


function profileLead(about: string) {
  const match = about.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : about;
}

function profileRest(about: string) {
  const lead = profileLead(about);
  const rest = about.slice(lead.length).trim();
  return rest;
}

function relevantExperience(provider: Provider, data: OnboardingData) {
  const labels = conditionLabels(data.conditions);
  const shared = provider.expertise.filter((item) => labels.some((label) => label === item));
  const parts = [...provider.backgrounds];
  if (shared.length > 0) parts.push(`care listed for ${shared.join(", ")}`);
  return parts.join(". ");
}

function ClinicianCard({
  provider,
  selected,
  expanded,
  data,
  onToggleAbout,
  onChoose,
}: {
  provider: Provider;
  selected: boolean;
  expanded: boolean;
  data: OnboardingData;
  onToggleAbout: () => void;
  onChoose: () => void;
}) {
  const first = provider.name.split(" ")[0];
  const experience = relevantExperience(provider, data);
  return (
    <article
      className={`relative rounded-xl p-5 sm:p-6 ${
        selected ? "border-2 border-[#0B6B3A] bg-[#E8F7EE]" : "border border-slate-200 bg-white"
      }`}
    >
      {selected ? (
        <Check className="absolute right-4 top-4 text-[#0B6B3A]" size={18} aria-label="Selected" />
      ) : null}
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <div>
          <img src={provider.photo} alt="" className="h-28 w-28 rounded-2xl object-cover" />
          <h3 className="mt-4 text-xl font-bold text-slate-900">{provider.name}</h3>
          <p className="mt-1 text-sm text-slate-700">{provider.credentials}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-800">{profileLead(provider.about)}</p>
          {experience ? <p className="mt-2 text-sm leading-relaxed text-slate-700">{experience}.</p> : null}
        </div>
        <IntroVideo key={`${provider.id}-${provider.video}`} name={provider.name} src={provider.video} poster={provider.photo} />
        <div>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={onToggleAbout}
            className="mt-3 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Read more
          </button>
          {expanded ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{profileRest(provider.about) || provider.about}</p>
          ) : null}
          <button
            type="button"
            aria-pressed={selected}
            onClick={onChoose}
            className="mt-3 inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Choose {first}
          </button>
        </div>
      </div>
    </article>
  );
}

function PreferenceGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="text-sm font-semibold text-slate-900">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(option.id)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-slate-900 ${choiceClass(on)}`}
            >
              {on ? <Check size={14} aria-hidden="true" /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
