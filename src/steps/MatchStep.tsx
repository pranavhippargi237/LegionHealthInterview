import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { ALL_PROVIDERS, CONDITIONS, insuranceMatchName, timeBand } from "../data";
import { addDays, formatBookingWhen, formatTimeLabel, parseDate, todayISO } from "../format";
import { useDialogs, useOnboarding } from "../state";
import type { BandCounts, DayPart, GenderFilter, OnboardingData, Provider, ScheduleAsk, Slot } from "../types";
import { ProfileMedia } from "../components/ProfileMedia";
import { PrimaryButton } from "../components/ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PARTS: { id: DayPart; label: string; hint: string }[] = [
  { id: "morning", label: "Morning", hint: "Before noon" },
  { id: "afternoon", label: "Afternoon", hint: "Noon to 5pm" },
  { id: "evening", label: "Evening", hint: "After 5pm" },
];
const GENDERS: { id: GenderFilter; label: string }[] = [
  { id: "any", label: "Any" },
  { id: "woman", label: "Woman" },
  { id: "man", label: "Man" },
  { id: "nonbinary", label: "Non-binary" },
];

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function emptyCounts(): BandCounts {
  return { morning: 0, afternoon: 0, evening: 0 };
}

function genderOk(provider: Provider, gender: GenderFilter) {
  return gender === "any" || provider.gender === gender;
}

function countBands(date: string | null, gender: GenderFilter, through: string | null): BandCounts {
  const counts = emptyCounts();
  const today = todayISO();
  for (const provider of ALL_PROVIDERS) {
    if (!genderOk(provider, gender)) continue;
    for (const slot of provider.slots) {
      if (slot.date < today) continue;
      if (date && slot.date !== date) continue;
      if (through && slot.date > through) continue;
      counts[timeBand(slot.time)] += 1;
    }
  }
  return counts;
}

function slotsIn(provider: Provider, band: DayPart, date: string | null) {
  const today = todayISO();
  return provider.slots
    .filter((slot) => slot.date >= today && timeBand(slot.time) === band && (!date || slot.date === date))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

function conditionLabels(ids: string[]) {
  const labels: string[] = [];
  for (const id of ids) {
    const label = CONDITIONS.find((item) => item.id === id)?.label;
    if (label) labels.push(label);
  }
  return labels;
}

function reason(provider: Provider, slot: Slot, data: OnboardingData) {
  const when = formatBookingWhen(slot.date, slot.time);
  const labels = conditionLabels(data.conditions);
  const shared = provider.expertise.filter((item) => labels.some((label) => label === item));
  const sentences = [
    `We suggested ${provider.name} because they have the soonest ${data.timeOfDay} visit in the window you chose: ${when}.`,
  ];
  if (shared.length > 0) sentences.push(`They also see people for ${shared.join(", ")}.`);
  if (data.insurance === "none") {
    sentences.push("You selected self-pay: $250 for a new patient visit and $150 for a follow-up.");
  } else if (data.insurance === "other") {
    sentences.push("You selected another plan. We'll verify those benefits before the visit.");
  } else if (data.insurance) {
    sentences.push(
      `You selected ${insuranceMatchName(data.insurance, data.bcbsState, data.otherInsurance)}. Most patients on that plan pay $0–$40 per session.`,
    );
  }
  sentences.push("Pick one of their open times. Your day and time of day stay as you set them.");
  return sentences.join(" ");
}

function genderLabel(gender: Provider["gender"]) {
  if (gender === "woman") return "Woman";
  if (gender === "man") return "Man";
  return "Non-binary";
}

function withArticle(part: DayPart) {
  return part === "evening" ? `an ${part}` : `a ${part}`;
}

function bandList(counts: BandCounts) {
  return (["morning", "afternoon", "evening"] as const)
    .filter((part) => counts[part] > 0)
    .map((part) => `${counts[part]} ${part}`)
    .join(" and ");
}

const PAGE_SIZE = 5;

export function MatchStep() {
  const { data, patch, recordSchedule } = useOnboarding();
  const { openHelp } = useDialogs();
  const [shown, setShown] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [nearbyNote, setNearbyNote] = useState("");
  const [monthCursor, setMonthCursor] = useState(() => {
    const source = data.preferredDate ? parseDate(data.preferredDate) : parseDate(todayISO());
    return { year: source.getFullYear(), month: source.getMonth() };
  });

  const band = data.timeOfDay;
  const horizon = addDays(todayISO(), 45);
  const onDay = data.preferredDate ? countBands(data.preferredDate, data.genderFilter, null) : null;
  const inNext45Days = countBands(null, data.genderFilter, horizon);

  const matches = useMemo(() => {
    if (!band) return [];
    return ALL_PROVIDERS.map((provider) => ({
      provider,
      slots: genderOk(provider, data.genderFilter) ? slotsIn(provider, band, data.preferredDate) : [],
    }))
      .filter((item) => item.slots.length > 0)
      .sort((a, b) => {
        const byTime = `${a.slots[0].date}${a.slots[0].time}`.localeCompare(`${b.slots[0].date}${b.slots[0].time}`);
        if (byTime !== 0) return byTime;
        const labels = conditionLabels(data.conditions);
        const overlap = (provider: Provider) =>
          provider.expertise.filter((item) => labels.some((label) => label === item)).length;
        return overlap(b.provider) - overlap(a.provider) || b.provider.rating - a.provider.rating;
      });
  }, [band, data.conditions, data.genderFilter, data.preferredDate]);

  const visible = matches.slice(0, shown);
  const slotsInRequest = data.preferredDate ? (onDay && band ? onDay[band] : 0) : band ? inNext45Days[band] : 0;

  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [data.preferredDate, data.timeOfDay, data.genderFilter]);

  useEffect(() => {
    if (!band) return;
    const result = slotsInRequest > 0 ? "shown" : "none_open";
    const lastOffer = [...data.scheduleAsks].reverse().find((ask) => ask.result === "shown" || ask.result === "none_open");
    if (
      lastOffer &&
      lastOffer.result === result &&
      lastOffer.date === data.preferredDate &&
      lastOffer.timeOfDay === band &&
      lastOffer.genderFilter === data.genderFilter &&
      lastOffer.slotsInRequest === slotsInRequest
    ) {
      return;
    }
    const ask: Omit<ScheduleAsk, "id" | "at"> = {
      date: data.preferredDate,
      timeOfDay: band,
      genderFilter: data.genderFilter,
      onDay,
      inNext45Days,
      slotsInRequest,
      result,
    };
    recordSchedule(ask);
  }, [
    band,
    data.genderFilter,
    data.preferredDate,
    data.scheduleAsks,
    inNext45Days,
    onDay,
    recordSchedule,
    slotsInRequest,
  ]);

  useEffect(() => {
    const node = sentinelRef.current;
    const expected = shown;
    if (!node || expected >= matches.length) return;
    let active = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!active || !entries.some((entry) => entry.isIntersecting)) return;
        setShown((count) => (count === expected ? Math.min(matches.length, count + PAGE_SIZE) : count));
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [matches.length, shown]);

  function snapshot(result: ScheduleAsk["result"]): Omit<ScheduleAsk, "id" | "at"> | null {
    if (!band) return null;
    return {
      date: data.preferredDate,
      timeOfDay: band,
      genderFilter: data.genderFilter,
      onDay,
      inNext45Days,
      slotsInRequest,
      result,
    };
  }

  function tryNearby() {
    if (!band) return;
    const anchor = data.preferredDate ?? matches[0]?.slots[0]?.date ?? todayISO();
    let found: string | null = null;
    for (let offset = 1; offset <= 45 && !found; offset += 1) {
      const forward = addDays(anchor, offset);
      if (forward <= horizon && countBands(forward, data.genderFilter, null)[band] > 0) found = forward;
    }
    for (let offset = 1; offset <= 21 && !found; offset += 1) {
      const back = addDays(anchor, -offset);
      if (back >= todayISO() && countBands(back, data.genderFilter, null)[band] > 0) found = back;
    }
    const ask = snapshot("nearby");
    if (ask) recordSchedule(ask);
    if (!found) {
      setNearbyNote(`No other ${band} day in the next 45 days. Your ${band} choice is still saved.`);
      return;
    }
    patch({ preferredDate: found, providerId: null, slotId: null, banner: "" });
    const when = parseDate(found);
    setMonthCursor({ year: when.getFullYear(), month: when.getMonth() });
    setNearbyNote(
      `Still looking for ${withArticle(band)}. Moved to ${when.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.`,
    );
  }

  function askForHelp() {
    const ask = snapshot("help");
    if (ask) recordSchedule(ask);
    openHelp();
  }

  function book(provider: Provider, slot: Slot) {
    const ask = snapshot("booked");
    if (ask) recordSchedule(ask);
    patch({ providerId: provider.id, slotId: slot.id, step: 4, banner: "" });
  }

  const firstOfMonth = new Date(monthCursor.year, monthCursor.month, 1);
  const daysInMonth = new Date(monthCursor.year, monthCursor.month + 1, 0).getDate();
  const startPad = firstOfMonth.getDay();
  const monthLabel = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const openDates = useMemo(() => {
    const dates = new Set<string>();
    for (const provider of ALL_PROVIDERS) {
      if (!genderOk(provider, data.genderFilter)) continue;
      for (const slot of provider.slots) {
        if (slot.date >= todayISO()) dates.add(slot.date);
      }
    }
    return dates;
  }, [data.genderFilter]);

  return (
    <div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900">When can you come?</h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Choose a day, then morning, afternoon, or evening. We'll list the clinicians who are free then, with credentials, a photo, and a 30-second intro. Five are shown first. Scroll for more.
        </p>

        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">What day works?</p>
          <button
            type="button"
            aria-pressed={!data.preferredDate}
            onClick={() => {
              setNearbyNote("");
              patch({ preferredDate: null, providerId: null, slotId: null, banner: "" });
            }}
            className={`mt-2 h-10 rounded-lg px-3 text-sm font-semibold ${
              !data.preferredDate ? "bg-brand text-white" : "border border-slate-200 text-slate-800"
            }`}
          >
            Soonest available
          </button>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200"
              onClick={() =>
                setMonthCursor((current) => {
                  const date = new Date(current.year, current.month - 1, 1);
                  return { year: date.getFullYear(), month: date.getMonth() };
                })
              }
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-semibold text-slate-900">{monthLabel}</p>
            <button
              type="button"
              aria-label="Next month"
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200"
              onClick={() =>
                setMonthCursor((current) => {
                  const date = new Date(current.year, current.month + 1, 1);
                  return { year: date.getFullYear(), month: date.getMonth() };
                })
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
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
              const open = openDates.has(iso);
              const selectedDay = data.preferredDate === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!open}
                  aria-pressed={selectedDay}
                  onClick={() => {
                    setNearbyNote("");
                    patch({ preferredDate: iso, providerId: null, slotId: null, banner: "" });
                  }}
                  className={`h-10 rounded-lg text-sm ${
                    selectedDay
                      ? "bg-brand font-semibold text-white"
                      : open
                        ? "border border-slate-200 font-medium text-slate-900 hover:border-brand"
                        : "text-slate-300"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-slate-900">Morning, afternoon, or evening?</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PARTS.map((part) => (
              <button
                key={part.id}
                type="button"
                aria-pressed={band === part.id}
                onClick={() => {
                  setNearbyNote("");
                  patch({ timeOfDay: part.id, providerId: null, slotId: null, banner: "" });
                }}
                className={`rounded-lg border px-2 py-2 text-left ${
                  band === part.id ? "border-brand bg-blue-50" : "border-slate-200"
                }`}
              >
                <span className="block text-sm font-semibold text-slate-900">{part.label}</span>
                <span className="block text-xs text-slate-500">{part.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-slate-900">Clinician, if you have a preference</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {GENDERS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={data.genderFilter === option.id}
                onClick={() => patch({ genderFilter: option.id, providerId: null, slotId: null, banner: "" })}
                className={`h-10 rounded-full border px-3 text-sm font-medium ${
                  data.genderFilter === option.id ? "border-brand bg-brand text-white" : "border-slate-200 text-slate-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {band ? (
        <div className="mt-4 space-y-4">
          {matches.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                {matches.length === 1 ? "1 clinician is free then" : `${matches.length} clinicians are free then`}
              </h2>
              <p className="text-sm text-slate-600">
                Showing {visible.length} of {matches.length}. The first person is the closest match for the time you chose.
              </p>
              {visible.map(({ provider, slots }, listIndex) => {
                const selected = slots.find((slot) => slot.id === data.slotId) ?? null;
                return (
                  <article key={provider.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    {listIndex === 0 ? (
                      <p className="text-sm font-semibold text-slate-500">Suggested</p>
                    ) : null}
                    <div className="mt-3 sm:grid sm:grid-cols-[minmax(0,280px)_1fr] sm:items-start sm:gap-4">
                      <ProfileMedia provider={provider} />
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{provider.name}</h3>
                        <p className="mt-1 text-sm font-medium text-slate-900">Credentials: {provider.credentials}</p>
                        <p className="text-sm text-slate-600">
                          {genderLabel(provider.gender)} · {provider.title}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-800">
                          <Star size={14} className="fill-[#B0893E] text-[#B0893E]" aria-hidden="true" />
                          <span className="font-semibold">{provider.rating.toFixed(1)}</span>
                          <span className="text-slate-500">({provider.reviews})</span>
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-700">
                          {listIndex === 0
                            ? reason(provider, slots[0], data)
                            : `Also free ${band}, starting ${formatBookingWhen(slots[0].date, slots[0].time)}.`}
                        </p>
                      </div>
                    </div>
                    <h4 className="mt-4 text-sm font-semibold text-slate-900">Available times</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {slots.slice(0, 6).map((slot) => {
                        const active = data.slotId === slot.id;
                        const when = parseDate(slot.date);
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => patch({ providerId: provider.id, slotId: slot.id, banner: "" })}
                            className={`rounded-lg border px-3 py-2 text-left text-sm ${
                              active ? "border-brand bg-blue-50" : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <span className="block font-medium">
                              {when.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            <span>{formatTimeLabel(slot.time)}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selected ? (
                      <div className="mt-3">
                        <PrimaryButton onClick={() => book(provider, selected)}>
                          Book {formatBookingWhen(selected.date, selected.time)}
                        </PrimaryButton>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">Choose one of these times to hold it.</p>
                    )}
                  </article>
                );
              })}
              {shown < matches.length ? (
                <div ref={sentinelRef} className="py-3 text-center text-sm text-slate-500">
                  Scroll for more clinicians
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500">That's everyone free in this window.</p>
              )}
            </div>
          ) : (
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-900">No {band} time is open then</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {onDay
                  ? `You asked for ${band}. ${
                      bandList(onDay)
                        ? `That day we can offer ${bandList(onDay)}.`
                        : "That day has no other open times either."
                    }`
                  : `You asked for the soonest ${band}. ${
                      inNext45Days[band] > 0
                        ? ""
                        : `In the next 45 days we have ${bandList(inNext45Days) || "no open times"}.`
                    }`}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {`We saved that you asked for ${band}. That shows us which hours to add, even when we can't book you today.`}
              </p>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">None of these work</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {`You can try a nearby day and keep ${band}${
                data.genderFilter !== "any" ? " and the clinician preference you already set" : ""
              }. You can also ask for help, or let us tell you when ${withArticle(band)} time opens.`}
            </p>
            {nearbyNote ? <p className="mt-2 text-sm text-slate-800">{nearbyNote}</p> : null}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={tryNearby}
                className="h-11 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800"
              >
                Try a nearby day
              </button>
              <button
                type="button"
                onClick={askForHelp}
                className="h-11 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800"
              >
                Ask for help
              </button>
            </div>
            <label className="mt-3 flex items-start gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#2F6BFF]"
                checked={data.notifyWhenOpen}
                onChange={(event) => {
                  const notify = event.target.checked;
                  patch({ notifyWhenOpen: notify });
                  if (notify) {
                    const ask = snapshot("notify");
                    if (ask) recordSchedule(ask);
                  }
                }}
              />
              <span>
                Tell me when {withArticle(band)} opening comes up. We will contact you only if this is checked, using the email
                on the next step.
              </span>
            </label>
          </section>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">Choose morning, afternoon, or evening to see clinicians.</p>
      )}
    </div>
  );
}
