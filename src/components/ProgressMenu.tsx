import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { STEPS } from "../data";
import { firstIncomplete, useOnboarding } from "../state";

const DETAILS = [
  "Required questions, on one page",
  "A day, a time of day, then a time",
  "Name and contact",
  "Confirm the visit",
];

export function ProgressMenu() {
  const { data, go, patch } = useOnboarding();
  const [open, setOpen] = useState(false);
  const [panelBox, setPanelBox] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const panelId = useId();
  const step = STEPS[data.step];
  const percent = data.booked ? 100 : step.percent;
  const incomplete = data.booked ? null : firstIncomplete(data);
  const place = data.booked ? "Appointment booked" : `Step ${data.step + 1} of ${STEPS.length}, ${step.label}`;

  useEffect(() => {
    if (!open) return;
    function place() {
      const button = rootRef.current?.querySelector("button");
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 32);
      const left = Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16));
      setPanelBox({ top: rect.bottom + 8, left, width });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Progress, ${place}`}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Progress
        <ChevronDown size={15} aria-hidden="true" className={open ? "rotate-180" : ""} />
      </button>
      {open ? (
        <div
          id={panelId}
          style={{ top: panelBox.top, left: panelBox.left, width: panelBox.width }}
          className="fixed z-30 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
        >
          <p id={labelId} className="text-sm font-semibold text-slate-900">
            {data.booked ? "Appointment booked" : `Step ${data.step + 1} of ${STEPS.length}`}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {data.booked ? "Your visit is the place to come back." : step.label}
          </p>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-labelledby={labelId}
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
          </div>
          <nav aria-label="Where you are in booking" className="mt-4">
            {data.booked ? (
              <button
                type="button"
                className="mb-3 block text-left text-sm font-semibold text-brand underline"
                onClick={() => {
                  patch({ rescheduling: false, awayFromVisit: false, banner: "" });
                  setOpen(false);
                }}
              >
                Your visit
              </button>
            ) : null}
            <ol>
              {STEPS.map((item, index) => {
                const active = data.booked ? data.rescheduling && index === 1 : index === data.step;
                const finished = data.booked || incomplete === null || index < incomplete;
                const done = finished && !active;
                const lineDone = data.booked || incomplete === null || index + 1 < incomplete;
                return (
                  <li key={item.label} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                    <span className="flex flex-col items-center" aria-hidden="true">
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                          done
                            ? "bg-brand text-white"
                            : active
                              ? "bg-white text-brand ring-2 ring-brand"
                              : "bg-white text-slate-400 ring-1 ring-slate-200"
                        }`}
                      >
                        {done ? <Check size={14} /> : index + 1}
                      </span>
                      {index < STEPS.length - 1 ? (
                        <span className={`my-1 w-0.5 flex-1 ${lineDone ? "bg-brand" : "bg-slate-200"}`} />
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (data.booked) {
                          patch(
                            index === 1
                              ? { rescheduling: true, awayFromVisit: false, banner: "" }
                              : { rescheduling: false, awayFromVisit: false, banner: "" },
                          );
                        } else {
                          go(index);
                        }
                        setOpen(false);
                      }}
                      aria-current={active ? "step" : undefined}
                      className="rounded-lg pb-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <span className="sr-only">
                        {done ? "Completed. " : active ? "Current step. " : index === incomplete ? "Started. " : "Not started. "}
                      </span>
                      <span
                        className={`block text-sm ${active ? "font-semibold text-slate-900" : finished ? "text-slate-800" : "text-slate-500"}`}
                      >
                        {item.label}
                      </span>
                      {active ? <span className="mt-0.5 block text-xs font-medium text-brand">You are here</span> : null}
                      <span className="mt-0.5 block text-xs leading-4 text-slate-500">{DETAILS[index]}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
