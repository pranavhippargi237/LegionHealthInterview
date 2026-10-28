import { useState } from "react";
import { Video } from "lucide-react";
import { findProvider, findSlot } from "../data";
import { digits, formatBookingWhen, formatPhone } from "../format";
import { useOnboarding } from "../state";
import type { Provider, Slot } from "../types";
import { ClinicianNote } from "../components/ClinicianNote";
import { VisitCost } from "../components/VisitCost";
import { inputClass, PrimaryButton } from "../components/ui";

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
  const provider = findProvider(data.providerId);
  const slot = findSlot(provider, data.slotId);
  const [calendarNote, setCalendarNote] = useState("");
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderChoice, setReminderChoice] = useState<"text" | "email" | null>(data.reminderChannel);
  const [reminderPhone, setReminderPhone] = useState(data.phone);
  const [reminderEmail, setReminderEmail] = useState(data.email);
  const [reminderError, setReminderError] = useState("");
  const profileName = [data.firstName, data.lastName].map((part) => part.trim()).filter(Boolean).join(" ");

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
        {data.visitPhase === "completed" || data.visitPhase === "waiting" ? (
          <div className="mt-4 rounded-xl bg-[#F3F7FD] px-4 py-4 text-sm leading-relaxed text-slate-700" role="status">
            {data.visitPhase === "completed" ? (
              <p className="font-semibold text-slate-900">The clinician confirmed this visit. Instructions are on this page.</p>
            ) : (
              <p className="font-semibold text-slate-900">
                Stay on this page while you wait. The visit is complete when the clinician confirms it.
              </p>
            )}
          </div>
        ) : null}
        <div className="mt-4 rounded-xl bg-[#F3F7FD] px-4 py-4 text-sm leading-relaxed text-slate-700">
          <p className="font-semibold text-slate-900">Your profile</p>
          {profileName ? <p className="mt-1 text-slate-900">{profileName}</p> : null}
          {data.email.trim() ? <p className="text-slate-700">{data.email.trim()}</p> : null}
          <p className="mt-1">
            {data.email.trim()
              ? "This profile was created when you booked. You can come back to this visit with this email."
              : "This profile was created when you booked."}
          </p>
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
        {data.last4 ? <p className="mt-4 text-sm text-slate-600">Card ending {data.last4} is on file for this visit.</p> : null}
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
            {data.visitPhase !== "completed" ? (
              <button
                type="button"
                aria-expanded={reminderOpen}
                onClick={() => setReminderOpen((open) => !open)}
                className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800"
              >
                Send Me a Reminder
              </button>
            ) : null}
            {data.visitPhase !== "completed" ? (
              <button
                type="button"
                onClick={() => patch({ visitDay: true, visitPhase: "waiting", connectionProblem: false, awayFromVisit: false, banner: "" })}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0F7A4A] px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Video size={16} aria-hidden="true" />
                Join
              </button>
            ) : null}
          </div>
        ) : null}
        {reminderOpen && data.visitPhase !== "completed" ? (
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
            <p className="mt-2 text-sm text-slate-600">
              This preview saves the reminder on this device. A message is not sent.
            </p>
          </form>
        ) : null}
        {data.reminderChannel && data.visitPhase !== "completed" ? (
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

      {data.visitPhase !== "completed" ? <ClinicianNote /> : null}

      <VisitCost data={data} />

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
