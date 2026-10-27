import { Check } from "lucide-react";
import { findProvider, findSlot } from "../data";
import { formatBookingWhen } from "../format";
import { useOnboarding } from "../state";

export function ConfirmationStep() {
  const { data, go, reset } = useOnboarding();
  const provider = findProvider(data.providerId);
  const slot = findSlot(provider, data.slotId);

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-brand">
          <Check size={26} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-[28px] font-bold tracking-tight text-slate-900">Your appointment is reserved</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This is a preview. Nothing was sent to a clinic, and no card was charged.
          {data.last4 ? ` Card ending ${data.last4} stayed in this browser only.` : ""}
        </p>
      </div>
      {provider && slot ? (
        <div className="mx-auto mt-6 max-w-lg rounded-xl bg-[#F3F7FD] p-5 text-sm text-slate-800">
          <p className="text-xs font-semibold tracking-wide text-slate-500">INTAKE VISIT · 60 MINUTES</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatBookingWhen(slot.date, slot.time)}
          </p>
          <p className="mt-1">{provider.name}</p>
          <p className="text-slate-600">{provider.title}</p>
        </div>
      ) : null}
      <div className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-slate-700">
        <h2 className="font-semibold text-slate-900">What would happen next</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          <li>You would confirm insurance and see an estimate before the visit.</li>
          <li>You can change or cancel online up to 48 hours before, at no charge.</li>
          <li>The first visit is about 60 minutes.</li>
        </ol>
      </div>
      <div className="mx-auto mt-6 flex max-w-lg flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => go(3)}
          className="h-11 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800"
        >
          Change appointment
        </button>
        <button
          type="button"
          onClick={() => go(4)}
          className="h-11 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800"
        >
          Edit info
        </button>
        <button
          type="button"
          onClick={reset}
          className="h-11 flex-1 rounded-lg text-sm font-semibold text-brand"
        >
          Start over
        </button>
      </div>
    </section>
  );
}
