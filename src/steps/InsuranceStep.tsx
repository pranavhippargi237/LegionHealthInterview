import { useState } from "react";
import { BCBS_STATES, INSURERS } from "../data";
import { useOnboarding } from "../state";
import { FormNote, inputClass, PrimaryButton, ResumeCard, SectionCard, StepHeading } from "../components/ui";

const IN_NETWORK = INSURERS.filter((insurer) => !["other", "none"].includes(insurer.id));

function Wordmark({ id }: { id: string }) {
  if (id === "aetna") {
    return <span className="text-[28px] font-bold lowercase tracking-tight text-[#7B2D8E]">aetna</span>;
  }
  if (id === "bcbs") {
    return (
      <span className="text-center">
        <span className="mx-auto mb-1 grid h-6 w-6 place-items-center rounded bg-[#1D4ED8] text-xs font-bold text-white">
          +
        </span>
        <span className="block text-sm font-bold leading-tight text-[#1E3A8A]">
          BlueCross
          <br />
          BlueShield
        </span>
      </span>
    );
  }
  if (id === "cigna") {
    return <span className="text-[26px] font-bold lowercase tracking-tight text-[#0F766E]">cigna</span>;
  }
  if (id === "uhc") {
    return (
      <span className="text-center text-base font-bold leading-tight text-[#1E3A8A]">
        United
        <br />
        Healthcare
      </span>
    );
  }
  if (id === "oscar") {
    return <span className="text-[28px] font-black lowercase tracking-tight text-[#4F46E5]">oscar</span>;
  }
  return null;
}

export function InsuranceStep() {
  const { data, patch } = useOnboarding();
  const [error, setError] = useState("");
  const inNetwork = Boolean(data.insurance && !["other", "none"].includes(data.insurance));

  function choose(id: string) {
    patch({ insurance: id, matchReady: false, banner: "" });
    setError("");
  }

  function continueStep() {
    if (!data.insurance) {
      setError("Choose a row so you know what this visit may cost.");
      return;
    }
    patch({ step: 2, banner: "" });
  }

  return (
    <>
      <SectionCard>
        <StepHeading
          title="What will this cost?"
          subtitle="The price depends on the row you choose. You don't have to guess after you pick a logo."
        />
        <div className="mt-6">
          {error ? <FormNote messages={[error]} /> : null}
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
            <div className="hidden grid-cols-[1.35fr_0.9fr] bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
              <div className="px-4 py-3">Coverage</div>
              <div className="px-4 py-3">What you pay</div>
            </div>

            <div
              className={`grid border-t border-slate-200 sm:grid-cols-[1.35fr_0.9fr] ${
                inNetwork ? "bg-blue-50/40" : "bg-white"
              }`}
            >
              <div className="p-4">
                <p className="font-semibold text-slate-900">Insurance</p>
                <p className="mt-1 text-sm text-slate-600">Select the plan on your card.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {IN_NETWORK.map((insurer) => {
                    const selected = data.insurance === insurer.id;
                    return (
                      <button
                        key={insurer.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => choose(insurer.id)}
                        className={`flex min-h-[92px] flex-col items-center justify-center rounded-lg border bg-white px-2 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                          selected ? "border-2 border-brand" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Wordmark id={insurer.id} />
                        <span className="mt-1 text-xs text-slate-500">{insurer.short}</span>
                      </button>
                    );
                  })}
                </div>
                {data.insurance === "bcbs" ? (
                  <label className="mt-3 block text-sm font-medium text-slate-800">
                    Which Blue Cross Blue Shield plan?
                    <select
                      className={`${inputClass} mt-1.5 font-normal`}
                      value={data.bcbsState}
                      onChange={(event) => patch({ bcbsState: event.target.value })}
                    >
                      {BCBS_STATES.map((state) => (
                        <option key={state}>{state}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <div className="border-t border-slate-200 p-4 sm:border-l sm:border-t-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:hidden">What you pay</p>
                <p className="text-2xl font-bold text-slate-900">$0–$40</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  per session for most patients on these plans. You can ask for an exact estimate before the visit.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-pressed={data.insurance === "other"}
              onClick={() => choose("other")}
              className={`grid w-full border-t border-slate-200 text-left sm:grid-cols-[1.35fr_0.9fr] ${
                data.insurance === "other" ? "bg-blue-50/40" : "bg-white hover:bg-slate-50"
              }`}
            >
              <span className="block p-4">
                <span className="block font-semibold text-slate-900">Other insurance</span>
                <span className="mt-1 block text-sm text-slate-600">A plan that is not listed above.</span>
              </span>
              <span className="block border-t border-slate-200 p-4 text-sm leading-relaxed text-slate-800 sm:border-l sm:border-t-0">
                We'll verify your insurance coverage in the next step to confirm your benefits.
              </span>
            </button>

            <button
              type="button"
              aria-pressed={data.insurance === "none"}
              onClick={() => choose("none")}
              className={`grid w-full border-t border-slate-200 text-left sm:grid-cols-[1.35fr_0.9fr] ${
                data.insurance === "none" ? "bg-blue-50/40" : "bg-white hover:bg-slate-50"
              }`}
            >
              <span className="block p-4">
                <span className="block font-semibold text-slate-900">No insurance</span>
                <span className="mt-1 block text-sm text-slate-600">You pay Legion directly.</span>
              </span>
              <span className="block border-t border-slate-200 p-4 text-sm leading-relaxed text-slate-800 sm:border-l sm:border-t-0">
                No problem! Our self-pay rate is $250 for New Patient Intakes & $150 for Followups. We'll help you get
                started.
              </span>
            </button>
          </div>

          {data.insurance === "other" ? (
            <label className="mt-4 block text-sm font-medium text-slate-800">
              Plan name
              <input
                value={data.otherInsurance}
                onChange={(event) => patch({ otherInsurance: event.target.value })}
                placeholder="Optional"
                className={`${inputClass} mt-1.5 font-normal`}
              />
            </label>
          ) : null}
        </div>
        <div className="mt-6">
          <PrimaryButton onClick={continueStep}>Continue</PrimaryButton>
        </div>
      </SectionCard>
      <ResumeCard />
    </>
  );
}
