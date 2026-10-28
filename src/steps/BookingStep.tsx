import { findProvider, findSlot } from "../data";
import { formatTimeUpper, parseDate } from "../format";
import { ClinicianNote } from "../components/ClinicianNote";
import { PrimaryButton } from "../components/ui";
import { useOnboarding } from "../state";

export function BookingStep() {
  const { data, go, patch } = useOnboarding();
  const provider = findProvider(data.providerId);
  const slot = findSlot(provider, data.slotId);

  if (!provider || !slot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold">Choose a time first</h1>
        <p className="mt-2 text-sm text-slate-600">An appointment time is required before you continue.</p>
        <button type="button" className="mt-4 h-12 rounded-lg bg-brand px-5 font-semibold text-white" onClick={() => go(1)}>
          Back to scheduling
        </button>
      </div>
    );
  }

  const when = parseDate(slot.date);
  const weekday = when.toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="pb-12">
      <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Complete Your Booking</h1>
      <p className="mt-1 text-sm text-slate-600">Add a note for your clinician if you want. Payment is the next page.</p>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <CalendarMark /> Your Selected Appointment
          </h2>
          <button
            type="button"
            onClick={() => go(1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300"
          >
            Change Appointment
          </button>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="w-16 shrink-0 rounded-xl bg-[#E8F0FE] py-2 text-center">
            <div className="text-[11px] font-semibold tracking-wide text-brand">
              {when.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
            </div>
            <div className="text-2xl font-bold text-slate-900">{when.getDate()}</div>
            <div className="text-[11px] font-semibold tracking-wide text-brand">
              {when.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{weekday}</p>
            <p className="text-xl font-bold text-brand">{formatTimeUpper(slot.time)}</p>
            <p className="text-sm text-slate-600">60 minute session</p>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-[11px] font-semibold tracking-wide text-slate-500">YOUR PROVIDER</p>
          <div className="mt-2 flex items-center gap-3">
            <img src={provider.photo} alt="" className="h-14 w-14 rounded-xl object-cover" />
            <div>
              <p className="font-semibold text-slate-900">{provider.name}</p>
              <p className="text-sm text-slate-600">{provider.title}</p>
              <p className="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                Intake Appointment
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-[#B9D4F5] bg-[#E8F0FE] px-3 py-3 text-sm leading-relaxed text-[#1E3A5F]">
            <p className="font-semibold text-slate-900">Cancellation policy</p>
            <p className="mt-1">
              Cancel or reschedule online at no charge up to 48 hours before your appointment. Late cancellations
              (within 48 hours) or no-shows (not arriving within 10 minutes) will incur a fee:{" "}
              <span className="font-semibold">$250 for initial visits, $100 for follow-ups</span>.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-4">
        <ClinicianNote />
      </div>

      <div className="mt-4">
        <PrimaryButton onClick={() => patch({ step: 4, banner: "" })}>Continue to payment</PrimaryButton>
      </div>
    </div>
  );
}

function CalendarMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-slate-700">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
