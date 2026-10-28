import { useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { firstIncomplete, useDialogs, useOnboarding } from "../state";

const NEXT_STEPS = [
  { label: "A few questions about getting started", indexes: [0] },
  { label: "Choose a time and clinician", indexes: [1] },
  { label: "Review your details and book", indexes: [2, 3, 4] },
  { label: "Get ready for your first visit", indexes: [] },
] as const;

export function NextSteps({ answered, total }: { answered: number; total: number }) {
  const { data } = useOnboarding();
  const { openHelp } = useDialogs();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const incomplete = data.booked ? null : firstIncomplete(data);

  const steps = NEXT_STEPS.map((item, position) => {
    if (position === NEXT_STEPS.length - 1) {
      return {
        label: item.label,
        active: data.booked && !data.rescheduling && data.visitPhase !== "completed",
        done: data.booked && data.visitPhase === "completed",
      };
    }
    const flags = item.indexes.map((index) => {
      const active = data.booked ? data.rescheduling && index === 1 : index === data.step;
      const finished = data.booked || incomplete === null || index < incomplete;
      return { active, done: finished && !active };
    });
    return {
      label: item.label,
      active: flags.some((flag) => flag.active),
      done: flags.every((flag) => flag.done),
    };
  });

  const current = steps.find((step) => step.active);
  const progressLabel = current
    ? current.label === NEXT_STEPS[0].label
      ? `${answered} of ${total} required questions answered`
      : current.label
    : "Your first visit is complete";

  return (
    <aside className="min-[1100px]:sticky min-[1100px]:top-6 min-[1100px]:order-2 min-[1100px]:max-h-[calc(100vh-3rem)] min-[1100px]:self-start min-[1100px]:overflow-y-auto">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 text-left min-[1100px]:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>
            <span className="block text-sm font-semibold text-slate-900">What happens next</span>
            <span className={`mt-1 block text-xs font-medium text-brand ${open ? "hidden" : ""}`}>{progressLabel}</span>
          </span>
          <ChevronDown size={16} aria-hidden="true" className={`mt-0.5 shrink-0 text-slate-500 ${open ? "rotate-180" : ""}`} />
        </button>

        <h2 className="hidden text-sm font-semibold text-slate-900 min-[1100px]:block">Here's what happens next</h2>

        <div id={panelId} className={`${open ? "mt-4 block" : "hidden"} min-[1100px]:mt-4 min-[1100px]:block`}>
          <ol aria-label="Here's what happens next">
            {steps.map((step, index) => {
              const last = index === steps.length - 1;
              const questions = index === 0;
              return (
                <li key={step.label} className="grid grid-cols-[16px_minmax(0,1fr)] gap-3" aria-current={step.active ? "step" : undefined}>
                  <span className="flex flex-col items-center" aria-hidden="true">
                    <span className="grid h-4 w-4 shrink-0 place-items-center">
                      {step.done ? (
                        <Check size={14} strokeWidth={2.5} className="text-[#0F7A4A]" />
                      ) : (
                        <span className={`h-2.5 w-2.5 rounded-full ${step.active ? "bg-brand" : "border border-slate-300 bg-white"}`} />
                      )}
                    </span>
                    {last ? null : <span className="mt-1 w-px flex-1 bg-slate-200" />}
                  </span>
                  <div className={last ? "" : "pb-4"}>
                    <p
                      className={`text-[13px] leading-5 ${
                        step.active ? "font-semibold text-brand" : step.done ? "text-slate-800" : "text-slate-500"
                      }`}
                    >
                      <span className="sr-only">{step.done ? "Finished. " : step.active ? "Current step. " : "Not started. "}</span>
                      {step.label}
                    </p>
                    {step.active && questions ? (
                      <p className="mt-1 text-xs leading-4 text-slate-600">
                        {answered} of {total} required questions answered
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>

          {current?.label === NEXT_STEPS[0].label ? (
            <p className="mt-4 text-xs leading-5 text-slate-600">You can change your answers before you continue.</p>
          ) : null}

          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">Need a hand?</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              This opens booking support for help with the form. In this preview, no one is waiting on a live call, and
              no message is sent.
            </p>
            <button
              type="button"
              onClick={openHelp}
              className="mt-3 inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Need help booking?
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
