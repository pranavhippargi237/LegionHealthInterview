import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { insuranceMatchName } from "../data";
import type { OnboardingData } from "../types";

function Status({ children }: { children: ReactNode }) {
  return (
    <p>
      <span className="font-semibold text-slate-900">Verification status:</span> {children}
    </p>
  );
}

export function VisitCost({ data }: { data: OnboardingData }) {
  const [open, setOpen] = useState(false);
  let body: ReactNode = null;

  if (data.insurance === "none") {
    body = (
      <>
        <p>
          You chose to pay without insurance. Prototype prices are $250 for the first visit and $150 for follow-ups.
          These are demo prices, not verified benefits and not a bill.
        </p>
        <Status>Not needed for self-pay.</Status>
        <p>Nothing here is still waiting on an insurance check.</p>
      </>
    );
  } else if (data.insurance === "other") {
    const plan = data.otherInsurance.trim() || "the plan you entered";
    body = (
      <>
        <p>
          You asked us to check {plan}. You are using coverage you already have. You are not buying insurance here, and
          this choice does not put you on self-pay.
        </p>
        <p>The visit cost is unknown until that coverage is checked.</p>
        <Status>Not verified.</Status>
      </>
    );
  } else if (data.insurance) {
    const plan = insuranceMatchName(data.insurance, data.bcbsState, data.otherInsurance);
    body = (
      <>
        <p>
          You selected {plan}, a plan you already have. You are not buying insurance through this form. The prototype
          estimate for a visit is $0–$40. That estimate is not a confirmation that the visit is covered.
        </p>
        <p>Your actual cost still needs a benefits check.</p>
        <Status>Not verified.</Status>
      </>
    );
  }

  if (!body) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white text-sm leading-relaxed text-slate-700">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center gap-2 px-4 py-4 text-left font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className="flex-1">What is known about the cost</span>
          <ChevronDown size={18} aria-hidden="true" className={open ? "rotate-180" : ""} />
        </button>
      </h2>
      {open ? <div className="space-y-2 px-4 pb-4">{body}</div> : null}
    </section>
  );
}
