import { useEffect, useRef, type ReactNode } from "react";
import { Phone, UserRound } from "lucide-react";
import { STEPS, TESTIMONIALS } from "../data";
import { useDialogs, useOnboarding } from "../state";
import { CrisisLine, Logo } from "./ui";

export function Shell({ children }: { children: ReactNode }) {
  const { data, go } = useOnboarding();
  const { openHelp } = useDialogs();
  const step = STEPS[data.step];
  const quote = TESTIMONIALS[data.step]?.quote ?? TESTIMONIALS[0].quote;
  const initial = data.firstName.trim().charAt(0).toUpperCase();
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = stepsRef.current;
    const active = row?.querySelector<HTMLElement>("[aria-current='step']");
    if (!row || !active) return;
    const left = active.offsetLeft - row.clientWidth / 2 + active.clientWidth / 2;
    row.scrollTo({ left: Math.max(0, left) });
  }, [data.step]);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="h-1 bg-brand" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-40 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
        <div className="min-w-0">
          <header className="mx-auto w-full max-w-[820px] px-5 pt-6">
            <Logo />
            <div className="mt-6 flex items-start justify-between gap-3">
              <p className="text-sm leading-5 text-slate-600">
                <span className="block font-medium text-slate-800 sm:inline">Step {data.step + 1} of 6</span>
                <span className="block text-slate-400 sm:ml-3 sm:inline">{step.percent}% Complete</span>
              </p>
              <button
                type="button"
                onClick={openHelp}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Phone size={15} aria-hidden="true" />
                Need help? Call us
              </button>
            </div>
            <div
              className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={step.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Booking progress"
            >
              <div className="h-full rounded-full bg-brand" style={{ width: `${step.percent}%` }} />
            </div>
            <div
              ref={stepsRef}
              className="mt-2 flex justify-between gap-3 overflow-x-auto pb-1 text-[11px] sm:text-xs"
            >
              {STEPS.map((item, index) => {
                const active = index === data.step;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => go(index)}
                    aria-current={active ? "step" : undefined}
                    className={`shrink-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      active
                        ? "font-semibold text-slate-900"
                        : index <= data.maxReached
                          ? "text-slate-600"
                          : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </header>
          <p className="sr-only" aria-live="polite">
            {data.booked ? "Appointment reserved" : `Step ${data.step + 1} of 6, ${step.label}`}
          </p>
          <main id="main" className="mx-auto w-full max-w-[820px] px-5 pt-6">
            {data.banner ? (
              <div
                role="status"
                className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
              >
                {data.banner}
              </div>
            ) : null}
            {children}
            <p className="mt-4 text-sm leading-relaxed text-slate-600 lg:hidden">“{quote}”</p>
          </main>
          <CrisisLine />
        </div>
        <aside className="relative hidden min-h-screen bg-panel lg:block">
          <div className="sticky top-0 flex h-screen flex-col px-10 py-6">
            <div className="flex justify-end">
              <div
                className="grid h-9 w-9 place-items-center rounded-full border border-white/80 bg-white text-sm font-semibold text-slate-700"
                aria-hidden="true"
              >
                {initial || <UserRound size={16} />}
              </div>
            </div>
            <figure className="flex flex-1 flex-col items-center justify-center text-center">
              <blockquote className="max-w-[340px] text-[15px] leading-7 text-slate-800">
                “{quote}”
              </blockquote>
              <figcaption className="mt-6 text-sm text-slate-500">Legion Health Patient</figcaption>
            </figure>
            <p className="pb-4 text-center text-sm text-slate-600">
              Join thousands of patients who trust Legion Health
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
