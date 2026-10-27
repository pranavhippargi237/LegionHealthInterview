import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { ALL_PROVIDERS, findProvider, findSlot, insuranceMatchName, timeBand } from "../data";
import { formatBookingWhen, formatTimeLabel, parseDate } from "../format";
import { useOnboarding } from "../state";
import type { GenderFilter, OnboardingData, Provider, Slot, TimeOfDay } from "../types";
import { PrimaryButton } from "../components/ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_OPTIONS: { id: TimeOfDay; label: string; hint: string }[] = [
  { id: "morning", label: "Morning", hint: "Before noon" },
  { id: "afternoon", label: "Afternoon", hint: "Noon to 5pm" },
  { id: "evening", label: "Evening", hint: "After 5pm" },
  { id: "any", label: "Any time", hint: "Show all" },
];
const GENDER_OPTIONS: { id: GenderFilter; label: string }[] = [
  { id: "any", label: "Any" },
  { id: "woman", label: "Woman" },
  { id: "man", label: "Man" },
  { id: "nonbinary", label: "Non-binary" },
];

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function slotFits(provider: Provider, slot: Slot, data: Pick<OnboardingData, "genderFilter" | "timeOfDay" | "preferredDate">) {
  if (data.genderFilter !== "any" && provider.gender !== data.genderFilter) return false;
  if (data.timeOfDay !== "any" && timeBand(slot.time) !== data.timeOfDay) return false;
  if (data.preferredDate && slot.date !== data.preferredDate) return false;
  return true;
}

function genderLabel(gender: Provider["gender"]) {
  if (gender === "woman") return "Woman";
  if (gender === "man") return "Man";
  return "Non-binary";
}

export function MatchStep() {
  const { data, patch } = useOnboarding();
  const [shown, setShown] = useState(3);
  const [monthCursor, setMonthCursor] = useState(() => {
    if (data.preferredDate) {
      const parsed = parseDate(data.preferredDate);
      return { year: parsed.getFullYear(), month: parsed.getMonth() };
    }
    return { year: 2026, month: 9 };
  });

  const matches = useMemo(() => {
    return ALL_PROVIDERS.map((provider) => ({
      provider,
      slots: provider.slots
        .filter((slot) => slotFits(provider, slot, data))
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    }))
      .filter((item) => item.slots.length > 0)
      .sort((a, b) => `${a.slots[0].date}${a.slots[0].time}`.localeCompare(`${b.slots[0].date}${b.slots[0].time}`));
  }, [data]);

  const openDates = useMemo(() => {
    const dates = new Set<string>();
    for (const provider of ALL_PROVIDERS) {
      if (data.genderFilter !== "any" && provider.gender !== data.genderFilter) continue;
      for (const slot of provider.slots) {
        if (data.timeOfDay !== "any" && timeBand(slot.time) !== data.timeOfDay) continue;
        dates.add(slot.date);
      }
    }
    return dates;
  }, [data.genderFilter, data.timeOfDay]);

  function apply(partial: Partial<OnboardingData>) {
    const next = { ...data, ...partial };
    const provider = findProvider(data.providerId);
    const slot = findSlot(provider, data.slotId);
    const keep = Boolean(provider && slot && slotFits(provider, slot, next));
    patch({
      ...partial,
      ...(keep ? {} : { providerId: null, slotId: null }),
      banner: "",
    });
    setShown(3);
  }

  const firstOfMonth = new Date(monthCursor.year, monthCursor.month, 1);
  const daysInMonth = new Date(monthCursor.year, monthCursor.month + 1, 0).getDate();
  const startPad = firstOfMonth.getDay();
  const monthLabel = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const visible = matches.slice(0, shown);
  const selected = findSlot(findProvider(data.providerId), data.slotId);
  const plan =
    !data.insurance || data.insurance === "none"
      ? "Self-pay is $250 for an intake and $150 for a follow-up."
      : data.insurance === "other"
        ? "We'll verify this plan before the visit."
        : `With ${insuranceMatchName(data.insurance, data.bcbsState, data.otherInsurance)}, most patients pay $0–$40 per session.`;

  return (
    <div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900">When works for you?</h1>
        <p className="mt-1 text-sm text-slate-600">
          Start with your day and time. We'll show clinicians who are free then. {plan}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!data.preferredDate}
            onClick={() => apply({ preferredDate: null })}
            className={`h-10 rounded-lg px-3 text-sm font-semibold ${
              !data.preferredDate ? "bg-brand text-white" : "border border-slate-200 text-slate-800"
            }`}
          >
            Soonest available
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
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
            {Array.from({ length: startPad }, (_, index) => (
              <div key={`pad-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const iso = isoDate(monthCursor.year, monthCursor.month, day);
              const open = openDates.has(iso);
              const selectedDay = data.preferredDate === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!open}
                  aria-pressed={selectedDay}
                  onClick={() => apply({ preferredDate: iso })}
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
          <legend className="text-sm font-semibold text-slate-900">Time of day</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIME_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={data.timeOfDay === option.id}
                onClick={() => apply({ timeOfDay: option.id })}
                className={`rounded-lg border px-2 py-2 text-left ${
                  data.timeOfDay === option.id ? "border-brand bg-blue-50" : "border-slate-200"
                }`}
              >
                <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                <span className="block text-xs text-slate-500">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-slate-900">Provider</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={data.genderFilter === option.id}
                onClick={() => apply({ genderFilter: option.id })}
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

      <div className="mt-5">
        <h2 className="text-lg font-bold text-slate-900">
          {matches.length === 0 ? "No openings match that" : `${matches.length} clinicians have this opening`}
        </h2>
        {matches.length === 0 ? (
          <p className="mt-1 text-sm text-slate-600">Try soonest, another time of day, or any provider.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {visible.map(({ provider, slots }) => (
              <article key={provider.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{provider.name}</h3>
                    <p className="text-sm text-slate-600">
                      {genderLabel(provider.gender)} · {provider.title}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-800">
                      <Star size={14} className="fill-[#B0893E] text-[#B0893E]" aria-hidden="true" />
                      <span className="font-semibold">{provider.rating.toFixed(1)}</span>
                      <span className="text-slate-500">({provider.reviews})</span>
                    </p>
                  </div>
                  {provider.badge === "soonest" ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                      Soonest
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {slots.slice(0, 6).map((slot) => {
                    const active = data.slotId === slot.id;
                    const when = parseDate(slot.date);
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          patch({ providerId: provider.id, slotId: slot.id, banner: "" });
                          requestAnimationFrame(() => {
                            document.getElementById(`book-${provider.id}`)?.scrollIntoView({ block: "nearest" });
                          });
                        }}
                        className={`rounded-lg border px-3 py-2 text-left text-sm ${
                          active ? "border-[#86C9A0] bg-[#E7F6EC] text-[#166534]" : "border-slate-200 hover:border-slate-300"
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
                {data.providerId === provider.id && selected ? (
                  <div id={`book-${provider.id}`} className="mt-3 scroll-mb-6">
                    <PrimaryButton onClick={() => patch({ step: 4, banner: "" })}>
                      Book {formatBookingWhen(selected.date, selected.time)}
                    </PrimaryButton>
                    <p className="mt-2 text-center text-xs text-slate-500">
                      Your first appointment lasts about 1 hour.
                    </p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
        {shown < matches.length ? (
          <button
            type="button"
            className="mt-3 h-11 w-full rounded-lg border border-slate-200 text-sm font-semibold text-slate-800"
            onClick={() => setShown((count) => count + 4)}
          >
            Show more clinicians ({matches.length - shown} remaining)
          </button>
        ) : null}
      </div>

      {selected ? (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">If an earlier time opens</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Your selected visit stays as it is. We will not move it, and we will not book a different clinician,
            unless you confirm first.
          </p>
          <label className="mt-3 flex items-start gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[#2F6BFF]"
              checked={data.wantEarlier}
              onChange={(event) => patch({ wantEarlier: event.target.checked })}
            />
            Ask me if an earlier time opens with this clinician.
          </label>
        </section>
      ) : null}
    </div>
  );
}
