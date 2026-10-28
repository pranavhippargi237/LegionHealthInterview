import { useState } from "react";
import { Check, Video } from "lucide-react";
import { findProvider, findSlot } from "../data";
import { digits, formatBookingWhen, formatPhone } from "../format";
import { useDialogs, useOnboarding } from "../state";
import type { Provider, Slot } from "../types";
import { VISIT_TOPICS } from "../visitNote";
import { HipaaBadge, inputClass, PrimaryButton } from "../components/ui";

function localISODate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function VisitIdentity({ provider, slot }: { provider: Provider; slot: Slot }) {
  return (
    <div className="mt-5 flex gap-4">
      <img src={provider.photo} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
      <div>
        <p className="text-base font-semibold text-slate-900">{provider.name}</p>
        <p className="mt-0.5 text-sm text-slate-700">{provider.credentials}</p>
        <p className="text-sm text-slate-600">{provider.title}</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">Virtual visit</p>
        <p className="mt-1 text-sm text-slate-800">
          {formatBookingWhen(slot.date, slot.time)} <span className="font-semibold">Central Time</span>
        </p>
      </div>
    </div>
  );
}

export function AwayFromVisit() {
  const { data, patch } = useOnboarding();
  const provider = findProvider(data.providerId);
  const slot = findSlot(provider, data.slotId);

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-8 sm:px-8">
      <h1 className="text-[28px] font-bold tracking-tight text-slate-900">You left your visit page.</h1>
      {provider && slot ? (
        <div className="mt-5 flex gap-4">
          <img src={provider.photo} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
          <div>
            <p className="text-base font-semibold text-slate-900">{provider.name}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Virtual visit</p>
            <p className="mt-1 text-sm text-slate-800">
              {formatBookingWhen(slot.date, slot.time)} <span className="font-semibold">Central Time</span>
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-slate-700">Your appointment is still booked.</p>
      )}
      <p className="mt-4 text-sm leading-relaxed text-slate-700">
        The appointment is unchanged, and anything you wrote is still on the visit page.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        This preview saves this visit in this browser tab. Closing the tab clears it.
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
  const [calendarNote, setCalendarNote] = useState("");
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderChoice, setReminderChoice] = useState<"text" | "email" | null>(data.reminderChannel);
  const [reminderPhone, setReminderPhone] = useState(data.phone);
  const [reminderEmail, setReminderEmail] = useState(data.email);
  const [reminderError, setReminderError] = useState("");
  const profileName = [data.firstName, data.lastName].map((part) => part.trim()).filter(Boolean).join(" ");
  const canJoin = Boolean(slot && (data.visitDay || slot.date === localISODate()));
  const upcoming = data.visitPhase === "upcoming";
  const waiting = data.visitPhase === "waiting";
  const completed = data.visitPhase === "completed";
  const savedWords = data.visitSharedNote.trim() || data.visitNote.trim();
  const callTopics = VISIT_TOPICS.filter((topic) => data.visitTopics.includes(topic.id));
  const callNote = data.visitNote.trim();

  return (
    <div className="space-y-4">
      {waiting && provider && slot ? (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-6 sm:px-8">
          <p className="text-sm font-semibold text-brand">Your visit</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Simulated video call</h1>
            <HipaaBadge />
          </div>
          <p className="mt-3 text-base text-slate-800">You are in a simulated call with {provider.name}.</p>
          <div className="mt-5 overflow-hidden rounded-2xl bg-[#16325C]">
            <div className="relative aspect-video">
              <img src={provider.photo} alt="" className="h-full w-full object-cover" />
              <p className="absolute bottom-4 left-4 rounded-lg bg-white/95 px-3 py-2 text-sm font-semibold text-slate-900">
                {provider.name}
              </p>
              <div className="absolute bottom-4 right-4 w-28 overflow-hidden rounded-lg border border-white/50 bg-[#1E3A5F] sm:w-40">
                <div className="flex aspect-video items-center justify-center px-2 text-center text-xs font-semibold leading-snug text-white">
                  Your video is off
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-800">
            Virtual visit · {formatBookingWhen(slot.date, slot.time)} <span className="font-semibold">Central Time</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            This is a simulated video call. {provider.name} is not on the call. They have not been notified.
          </p>
          <div className="mt-4 rounded-xl bg-[#E8F0FE] px-5 py-5">
            <p className="text-base font-bold text-black">Your notes</p>
            {callTopics.length > 0 ? (
              <p className="mt-2 text-sm text-slate-800">{callTopics.map((topic) => topic.label).join(" · ")}</p>
            ) : null}
            {callNote ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{callNote}</p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-slate-700">You didn't add a note before this call.</p>
            )}
          </div>
          <button
            type="button"
            className="mt-4 h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-800"
            onClick={() => patch({ connectionProblem: true, banner: "" })}
          >
            Connection problem, or the clinician has not joined
          </button>
          {data.connectionProblem ? (
            <div className="mt-4 rounded-xl bg-[#F3F7FD] px-4 py-4 text-sm leading-relaxed text-slate-700">
              <p className="font-semibold text-slate-900">Stay on this page.</p>
              <p className="mt-2">
                Try joining again if the connection drops. If the clinician has not joined, the booking team can check
                whether they are running late.
              </p>
              <p className="mt-2">
                A connection problem is not an emergency. For an emergency, call 911. For a crisis, call or text 988.
              </p>
              <p className="mt-2">In this demo, trying again stays in the simulated call. No message is sent.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white"
                  onClick={() => patch({ connectionProblem: false, banner: "" })}
                >
                  Try joining again
                </button>
                <button
                  type="button"
                  className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800"
                  onClick={openHelp}
                >
                  Contact the booking team
                </button>
              </div>
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="h-11 rounded-lg bg-[#C53030] px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              onClick={() => patch({ visitPhase: "upcoming", connectionProblem: false, banner: "" })}
            >
              Leave the call
            </button>
            <button
              type="button"
              className="h-11 px-1 text-sm font-semibold text-brand underline"
              onClick={() => patch({ visitPhase: "completed", connectionProblem: false, banner: "" })}
            >
              Demo: clinician confirms this visit is complete
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-6 sm:px-8">
          <p className="text-sm font-semibold text-brand">Your visit</p>
          <h1 className="mt-2 flex items-start gap-3 text-[28px] font-bold tracking-tight text-slate-900">
            <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F7EE] text-[#0F7A4A]">
              <Check size={18} aria-hidden="true" />
            </span>
            <span>{completed ? "Your first visit is complete." : "Your appointment is booked."}</span>
          </h1>
          {provider && slot ? <VisitIdentity provider={provider} slot={slot} /> : null}
          {profileName || data.email.trim() ? (
            <p className="mt-4 text-sm text-slate-700">
              This visit is saved for {profileName || "you"}
              {data.email.trim() ? ` · ${data.email.trim()}` : ""}.
            </p>
          ) : null}
          {upcoming ? (
            <div className="mt-5">
              <p className="text-base leading-relaxed text-slate-800">
                {canJoin
                  ? "It's time for your visit."
                  : "Come back here when it's time for your visit. You can open the simulated call now."}
              </p>
              <button
                type="button"
                onClick={() =>
                  patch({ visitPhase: "waiting", connectionProblem: false, awayFromVisit: false, banner: "" })
                }
                className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
              >
                <Video size={18} aria-hidden="true" />
                Join your visit
              </button>
            </div>
          ) : null}
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            This preview saves this visit in this browser tab. Closing the tab clears it.
          </p>
          {data.last4 ? <p className="mt-4 text-sm text-slate-600">Card ending {data.last4} is on file for this visit.</p> : null}
          {provider && slot ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {!completed ? (
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
                className={`h-11 rounded-lg px-4 text-sm font-semibold ${
                  upcoming ? "border border-slate-200 bg-white text-slate-800" : "bg-brand text-white"
                }`}
              >
                Add to calendar
              </button>
              {!completed ? (
                <button
                  type="button"
                  aria-expanded={reminderOpen}
                  onClick={() => setReminderOpen((open) => !open)}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800"
                >
                  Send Me a Reminder
                </button>
              ) : null}
              <button
                type="button"
                onClick={openHelp}
                className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800"
              >
                Need help
              </button>
            </div>
          ) : null}
          {reminderOpen && !completed ? (
            <form
              className="mt-4 rounded-xl border border-slate-200 bg-[#F3F7FD] p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (reminderChoice === "text") {
                  if (digits(reminderPhone).length !== 10) {
                    setReminderError("Enter a 10-digit phone number for the text message.");
                    return;
                  }
                  patch({ reminderChannel: "text", phone: formatPhone(reminderPhone), banner: "" });
                } else if (reminderChoice === "email") {
                  if (!/^\S+@\S+\.\S+$/.test(reminderEmail.trim())) {
                    setReminderError("Enter an email address for the reminder.");
                    return;
                  }
                  patch({ reminderChannel: "email", email: reminderEmail.trim(), banner: "" });
                } else {
                  setReminderError("Choose text message or email.");
                  return;
                }
                setReminderError("");
                setReminderOpen(false);
              }}
            >
              <p className="text-sm font-semibold text-slate-900">Prior 24 Hour Reminder</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                You can continue to add additional context if you want. Reply to the email or text reminder if anything
                else comes up.
              </p>
              <fieldset className="mt-3">
                <legend className="text-sm font-medium text-slate-800">How should we send it?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={reminderChoice === "text"}
                    onClick={() => setReminderChoice("text")}
                    className={`h-10 rounded-lg border px-3 text-sm font-semibold ${
                      reminderChoice === "text" ? "border-[#0B6B3A] bg-[#E8F7EE] text-slate-900" : "border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    Text message
                  </button>
                  <button
                    type="button"
                    aria-pressed={reminderChoice === "email"}
                    onClick={() => setReminderChoice("email")}
                    className={`h-10 rounded-lg border px-3 text-sm font-semibold ${
                      reminderChoice === "email" ? "border-[#0B6B3A] bg-[#E8F7EE] text-slate-900" : "border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    Email
                  </button>
                </div>
              </fieldset>
              {reminderChoice === "text" ? (
                <label className="mt-3 block text-sm font-medium text-slate-800">
                  Phone number
                  <input
                    type="tel"
                    inputMode="tel"
                    value={reminderPhone}
                    onChange={(event) => setReminderPhone(formatPhone(event.target.value))}
                    placeholder="(555) 010-0199"
                    className={`${inputClass} mt-1.5 font-normal`}
                  />
                </label>
              ) : null}
              {reminderChoice === "email" ? (
                <label className="mt-3 block text-sm font-medium text-slate-800">
                  Email
                  <input
                    type="email"
                    value={reminderEmail}
                    onChange={(event) => setReminderEmail(event.target.value)}
                    placeholder="name@example.com"
                    className={`${inputClass} mt-1.5 font-normal`}
                  />
                </label>
              ) : null}
              {reminderError ? <p className="mt-2 text-sm text-slate-800">{reminderError}</p> : null}
              <button type="submit" className="mt-3 h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white">
                Save reminder
              </button>
              <p className="mt-2 text-sm text-slate-600">This preview saves the reminder on this device. A message is not sent.</p>
            </form>
          ) : null}
          {data.reminderChannel && !completed ? (
            <p className="mt-3 text-sm text-slate-700" role="status">
              {data.reminderChannel === "text"
                ? `Prior 24 hour reminder set for a text to ${data.phone}.`
                : `Prior 24 hour reminder set for an email to ${data.email}.`}
            </p>
          ) : null}
          {calendarNote ? (
            <p className="mt-3 text-sm text-slate-700" role="status">
              {calendarNote}
            </p>
          ) : null}
        </section>
      )}

      {completed && savedWords ? (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900">What you wrote</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{savedWords}</p>
          <p className="mt-2 text-sm text-slate-600">This is your note. It is not a care plan, and it was not sent to a clinic.</p>
        </section>
      ) : null}

      {completed ? (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900">Next step</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">No follow-up is booked.</p>
        </section>
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
