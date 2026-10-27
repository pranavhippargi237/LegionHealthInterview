import { useState } from "react";
import { findProvider, findSlot } from "../data";
import { formatBookingWhen } from "../format";
import { useDialogs, useOnboarding } from "../state";
import type { DayPart, Provider, Slot } from "../types";
import { ClinicianNote } from "../components/ClinicianNote";
import { VisitCost } from "../components/VisitCost";
import { PrimaryButton } from "../components/ui";

const PARTS: { id: DayPart; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
];

export function AwayFromVisit() {
  const { data, patch } = useOnboarding();
  const provider = findProvider(data.providerId);
  const slot = findSlot(provider, data.slotId);

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-8 sm:px-8">
      <h1 className="text-[28px] font-bold tracking-tight text-slate-900">You left your visit page.</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">
        {provider && slot
          ? `Your appointment is still booked for ${formatBookingWhen(slot.date, slot.time)} Central Time with ${provider.name}.`
          : "Your appointment is still booked."}
      </p>
      <div className="mt-5">
        <PrimaryButton onClick={() => patch({ awayFromVisit: false, banner: "" })}>Return to your visit</PrimaryButton>
      </div>
    </section>
  );
}

export function ConfirmationStep() {
  const { data, patch, reset } = useOnboarding();
  const { openHelp } = useDialogs();
  const provider = findProvider(data.providerId);
  const slot = findSlot(provider, data.slotId);
  const [saved, setSaved] = useState(false);
  const [calendarNote, setCalendarNote] = useState("");

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-6 sm:px-8">
        <p className="text-sm font-semibold text-brand">Your visit</p>
        <h1 className="mt-2 text-[28px] font-bold tracking-tight text-slate-900">
          {data.visitPhase === "completed"
            ? "This visit took place."
            : data.visitPhase === "waiting"
              ? "You're in the waiting room."
              : "Your appointment is booked."}
        </h1>
        <div className="mt-4 rounded-xl bg-[#F3F7FD] px-4 py-4 text-sm leading-relaxed text-slate-700" role="status">
          {data.visitPhase === "completed" ? (
            <p className="font-semibold text-slate-900">The clinician confirmed this visit. Instructions are on this page.</p>
          ) : data.visitPhase === "waiting" ? (
            <p className="font-semibold text-slate-900">
              Stay on this page while you wait. The visit is complete when the clinician confirms it.
            </p>
          ) : (
            <>
              <p className="font-semibold text-slate-900">Nothing left to finish. You can show up.</p>
              <p className="mt-1">Join is on this page the day of the visit.</p>
            </>
          )}
        </div>
        {provider && slot ? (
          <div className="mt-5 flex gap-4">
            <img src={provider.photo} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
            <div>
              <p className="text-base font-semibold text-slate-900">{provider.name}</p>
              <p className="mt-0.5 text-sm text-slate-700">{provider.credentials}</p>
              <p className="text-sm text-slate-600">{provider.title}</p>
              <p className="mt-2 text-sm text-slate-800">
                {formatBookingWhen(slot.date, slot.time)} <span className="font-semibold">Central Time</span>
              </p>
            </div>
          </div>
        ) : null}
        <div className="mt-4">
          <VisitCost data={data} />
        </div>
        {data.last4 ? <p className="mt-3 text-sm text-slate-600">Card ending {data.last4} is on file for this visit.</p> : null}
        {provider && slot ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.visitPhase !== "completed" ? (
              <button
                type="button"
                onClick={() => patch({ rescheduling: true, awayFromVisit: false, banner: "" })}
                className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-800"
              >
                Reschedule this visit
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setCalendarNote(downloadVisitCalendar(provider, slot))}
              className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white"
            >
              Add to calendar
            </button>
          </div>
        ) : null}
        {calendarNote ? (
          <p className="mt-3 text-sm text-slate-700" role="status">
            {calendarNote}
          </p>
        ) : null}
      </section>

      {data.visitPhase !== "completed" ? <ClinicianNote /> : null}

      {data.visitPhase === "completed" ? (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900">Instructions from your clinician</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Demo note from {provider?.name ?? "your clinician"}: Follow the plan discussed in this visit, and message
            the care team if something is hard to manage before you are seen again.
          </p>
          <h2 className="mt-5 text-lg font-bold text-slate-900">Next step</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            No next visit is on the calendar. A follow-up is booked when you and your clinician decide you want one.
          </p>
        </section>
      ) : null}

      {data.visitPhase !== "completed" ? (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900">Joining</h2>
          {data.visitPhase === "upcoming" && !data.visitDay ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                On the day of the visit, Join opens the waiting room from this page.
              </p>
              <button
                type="button"
                className="mt-3 h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-800"
                onClick={() => patch({ visitDay: true, banner: "" })}
              >
                Demo: treat today as the visit day
              </button>
            </>
          ) : null}
          {data.visitPhase === "upcoming" && data.visitDay ? (
            <div className="mt-3">
              <PrimaryButton onClick={() => patch({ visitPhase: "waiting", connectionProblem: false, banner: "" })}>
                Join
              </PrimaryButton>
            </div>
          ) : null}
          {data.visitPhase === "waiting" ? (
            <div className="mt-3 text-sm leading-relaxed text-slate-700">
              <p>You are checked in. This page stays open. A video call starts when the clinician joins.</p>
              <p className="mt-2">In this demo, the clinician does not join on their own.</p>
              <button
                type="button"
                className="mt-3 h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-800"
                onClick={() => patch({ connectionProblem: true, banner: "" })}
              >
                Connection problem, or the clinician has not joined
              </button>
              {data.connectionProblem ? (
                <div className="mt-3 rounded-xl bg-[#F3F7FD] px-4 py-4">
                  <p className="font-semibold text-slate-900">Stay on this page.</p>
                  <p className="mt-1">
                    Try joining again if the connection drops. If the clinician has not joined, the booking team can
                    check whether they are running late.
                  </p>
                  <p className="mt-2">A connection problem is not an emergency. For an emergency, call 911. For a crisis, call or text 988.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white"
                      onClick={() => patch({ connectionProblem: false, banner: "" })}
                    >
                      Try joining again
                    </button>
                    <button
                      type="button"
                      className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-800"
                      onClick={openHelp}
                    >
                      Contact the booking team
                    </button>
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                className="mt-4 block text-sm font-semibold text-brand underline"
                onClick={() => patch({ visitPhase: "completed", connectionProblem: false, banner: "" })}
              >
                Demo: clinician confirms this visit is complete
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {data.visitPhase !== "completed" ? (
        <EarlierOffer saved={saved} setSaved={setSaved} providerName={provider?.name ?? "this clinician"} />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => patch({ awayFromVisit: true, rescheduling: false, banner: "" })}
          className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-800"
        >
          Leave this page
        </button>
        <button type="button" onClick={reset} className="h-11 rounded-lg px-4 text-sm font-semibold text-brand">
          Start over
        </button>
      </div>
    </div>
  );
}

function centralStamp(date: string, time: string, extraHours: number) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, hour + extraHours, minute));
  const parts = [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ];
  const clock = `${String(value.getUTCHours()).padStart(2, "0")}${String(value.getUTCMinutes()).padStart(2, "0")}00`;
  return `${parts.join("")}T${clock}`;
}

function downloadVisitCalendar(provider: Provider, slot: Slot) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Legion Health//Visit//EN",
    "BEGIN:VEVENT",
    `DTSTART;TZID=America/Chicago:${centralStamp(slot.date, slot.time, 0)}`,
    `DTEND;TZID=America/Chicago:${centralStamp(slot.date, slot.time, 1)}`,
    `SUMMARY:Legion Health visit with ${provider.name}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "legion-health-visit.ics";
  link.click();
  URL.revokeObjectURL(url);
  return "A calendar file for this visit downloaded. Your booked appointment is unchanged.";
}

function EarlierOffer({
  saved,
  setSaved,
  providerName,
}: {
  saved: boolean;
  setSaved: (value: boolean) => void;
  providerName: string;
}) {
  const { data, patch } = useOnboarding();

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-8">
      <p className="text-xs font-semibold tracking-wide text-slate-500">DEMO ONLY</p>
      <h2 className="mt-1 text-lg font-bold text-slate-900">Would you like us to let you know if an earlier appointment opens?</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        We'll keep your current appointment. If an earlier time becomes available, you can review it and choose
        whether to switch. Nothing changes without your approval.
      </p>
      <p className="mt-2 text-sm text-slate-600">Simulated. No notification is scheduled, sent, or saved outside this browser.</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          aria-pressed={data.wantEarlier}
          onClick={() => {
            setSaved(false);
            patch({ wantEarlier: true, banner: "" });
          }}
          className={`h-10 rounded-lg border px-3 text-sm font-semibold ${
            data.wantEarlier ? "border-brand bg-brand text-white" : "border-slate-200 text-slate-800"
          }`}
        >
          Yes, let me know
        </button>
        <button
          type="button"
          aria-pressed={!data.wantEarlier}
          onClick={() => {
            setSaved(false);
            patch({ wantEarlier: false, banner: "" });
          }}
          className={`h-10 rounded-lg border px-3 text-sm font-semibold ${
            !data.wantEarlier ? "border-brand bg-brand text-white" : "border-slate-200 text-slate-800"
          }`}
        >
          No thanks
        </button>
      </div>
      {data.wantEarlier ? (
        <div className="mt-4 space-y-4">
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">Who can the earlier offer include?</legend>
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex items-start gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="earlier-who"
                  checked={data.rescheduleWith !== "any"}
                  onChange={() => patch({ rescheduleWith: "current" })}
                />
                Only {providerName}
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="earlier-who"
                  checked={data.rescheduleWith === "any"}
                  onChange={() => patch({ rescheduleWith: "any" })}
                />
                Another suitable clinician is fine
              </label>
            </div>
          </fieldset>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Availability you already gave us</h3>
            <p className="mt-1 text-sm text-slate-600">Edit it here. You do not need to enter it again from scratch.</p>
            <label className="mt-3 block text-sm font-medium text-slate-800">
              Day
              <input
                type="date"
                value={data.preferredDate ?? ""}
                onChange={(event) => {
                  setSaved(false);
                  patch({ preferredDate: event.target.value || null });
                }}
                className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal"
              />
            </label>
            <fieldset className="mt-3">
              <legend className="text-sm font-medium text-slate-800">Time of day</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {PARTS.map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    aria-pressed={data.timeOfDay === part.id}
                    onClick={() => {
                      setSaved(false);
                      patch({ timeOfDay: part.id });
                    }}
                    className={`h-10 rounded-lg border px-3 text-sm ${
                      data.timeOfDay === part.id ? "border-brand bg-blue-50 font-semibold" : "border-slate-200"
                    }`}
                  >
                    {part.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="mt-3 block text-sm font-medium text-slate-800">
              Anything else about when you can come
              <textarea
                value={data.availabilityNote}
                onChange={(event) => {
                  setSaved(false);
                  patch({ availabilityNote: event.target.value });
                }}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal"
              />
            </label>
            <button
              type="button"
              className="mt-3 h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white"
              onClick={() => setSaved(true)}
            >
              Save this availability
            </button>
            {saved ? (
              <p className="mt-2 text-sm text-slate-700" role="status">
                Saved in this demo only. Your booked appointment is unchanged, and no alert was scheduled.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
