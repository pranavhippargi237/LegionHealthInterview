import { insuranceMatchName } from "../data";
import type { OnboardingData } from "../types";

export function VisitCost({ data }: { data: OnboardingData }) {
  if (data.insurance === "none") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
        <p className="font-semibold text-slate-900">What is known about the cost</p>
        <p className="mt-1">
          You chose to pay without insurance. Prototype prices are $250 for the first visit and $150 for follow-ups.
          These are demo prices, not verified benefits and not a bill.
        </p>
        <p className="mt-2">
          <span className="font-semibold text-slate-900">Verification status:</span> Not needed for self-pay.
        </p>
        <p className="mt-2">Nothing here is still waiting on an insurance check.</p>
      </div>
    );
  }

  if (data.insurance === "other") {
    const plan = data.otherInsurance.trim() || "the plan you entered";
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
        <p className="font-semibold text-slate-900">What is known about the cost</p>
        <p className="mt-1">
          You asked us to check {plan}. You are using coverage you already have. You are not buying insurance here, and
          this choice does not put you on self-pay.
        </p>
        <p className="mt-2">The visit cost is unknown until that coverage is checked.</p>
        <p className="mt-2">
          <span className="font-semibold text-slate-900">Verification status:</span> Not verified.
        </p>
      </div>
    );
  }

  if (!data.insurance) return null;

  const plan = insuranceMatchName(data.insurance, data.bcbsState, data.otherInsurance);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
      <p className="font-semibold text-slate-900">What is known about the cost</p>
      <p className="mt-1">
        You selected {plan}, a plan you already have. You are not buying insurance through this form. The prototype
        estimate for a visit is $0–$40. That estimate is not a confirmation that the visit is covered.
      </p>
      <p className="mt-2">Your actual cost still needs a benefits check.</p>
      <p className="mt-2">
        <span className="font-semibold text-slate-900">Verification status:</span> Not verified.
      </p>
    </div>
  );
}
