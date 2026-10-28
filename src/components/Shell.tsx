import type { ReactNode } from "react";
import { Phone } from "lucide-react";
import { STEPS, TESTIMONIALS } from "../data";
import { useDialogs, useOnboarding } from "../state";
import { ProfileMenu } from "./ProfileMenu";
import { ProgressMenu } from "./ProgressMenu";
import { HipaaBadge, Logo } from "./ui";

export function Shell({ children }: { children: ReactNode }) {
  const { data } = useOnboarding();
  const { openHelp } = useDialogs();
  const step = STEPS[data.step];
  const quote = TESTIMONIALS[data.step]?.quote ?? TESTIMONIALS[0].quote;
  const scheduling = data.rescheduling || (!data.booked && data.step === 1);
  const frame = scheduling ? "mx-auto w-full max-w-[1280px] px-4 sm:px-6" : "w-full px-5 sm:px-8";

  return (
    <div className="min-h-screen bg-canvas">
      <div className="h-1 bg-brand" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-40 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className={`${frame} ${scheduling ? "pt-3" : "pt-6"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3">
            <Logo />
            <HipaaBadge />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ProgressMenu />
            <button
              type="button"
              onClick={openHelp}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Phone size={15} aria-hidden="true" />
              Need help booking?
            </button>
            <ProfileMenu />
          </div>
        </div>
        {scheduling ? null : (
          <figure className="mt-5 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <blockquote className="max-w-4xl text-sm leading-relaxed text-slate-700">“{quote}”</blockquote>
            <figcaption className="shrink-0 text-sm text-slate-500">Legion Health Patient</figcaption>
          </figure>
        )}
      </header>
      <p className="sr-only" aria-live="polite">
        {data.booked
          ? data.rescheduling
            ? "Rescheduling. Your current appointment stays until you switch."
            : data.awayFromVisit
              ? "You left your visit page. The appointment is still booked."
              : data.visitPhase === "completed"
                ? "This visit took place."
                : data.visitPhase === "waiting"
                  ? "Waiting room."
                  : "Your visit."
          : `Step ${data.step + 1} of ${STEPS.length}, ${step.label}`}
      </p>
      <main id="main" className={`${frame} ${scheduling ? "pt-3" : "pt-6"}`}>
        {data.banner ? (
          <div role="status" className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800">
            {data.banner}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
