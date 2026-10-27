import { useState } from "react";
import {
  Brain,
  Check,
  CircleAlert,
  CircleHelp,
  Cloud,
  Ellipsis,
  Heart,
  Link2,
  Pill,
  Shield,
  Stethoscope,
  Zap,
} from "lucide-react";
import { CONDITIONS, HELP_OPTIONS } from "../data";
import { useOnboarding } from "../state";
import { FormNote, PrimaryButton, ResumeCard, SectionCard, StepHeading } from "../components/ui";

const HELP_ICONS = {
  existing: Link2,
  new: Stethoscope,
  unsure: Heart,
} as const;

const CONDITION_ICONS = {
  adhd: Brain,
  depression: Cloud,
  anxiety: CircleAlert,
  bipolar: Zap,
  ptsd: Shield,
  unsure: CircleHelp,
  other: Ellipsis,
} as const;

export function HelpStep() {
  const { data, patch } = useOnboarding();
  const [error, setError] = useState("");
  const adhdSelected = data.conditions.includes("adhd");

  function toggle(id: string) {
    const conditions = data.conditions.includes(id)
      ? data.conditions.filter((item) => item !== id)
      : [...data.conditions, id];
    patch({ conditions, banner: "" });
  }

  function continueStep() {
    if (!data.help) {
      setError("Choose the kind of help you want. A diagnosis is optional.");
      return;
    }
    patch({ step: 3, banner: "" });
  }

  const choices = CONDITIONS.filter((condition) => condition.id !== "adhd" || !adhdSelected);

  return (
    <>
      <SectionCard>
        <StepHeading
          title="How can we help you?"
          subtitle="Everyone's health journey is unique. We want to give you the best care we can."
        />
        <div className="mt-6 space-y-3">
          {error ? <FormNote messages={[error]} /> : null}
          {HELP_OPTIONS.map((option) => {
            const selected = data.help === option.id;
            const Icon = HELP_ICONS[option.id];
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  patch({ help: option.id, banner: "" });
                  setError("");
                }}
                className={`relative w-full rounded-xl border px-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  selected ? "border-brand bg-brand text-white" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                      selected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold">{option.title}</span>
                    <span className={`mt-0.5 block text-sm ${selected ? "text-white/90" : "text-slate-600"}`}>
                      {option.detail}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h2 className="text-base font-semibold text-slate-900">
            If you'd like to seek treatment for a diagnosis, select any you'd like help with.
          </h2>
          <p className="mt-1 text-sm text-slate-600">This is optional. You can keep going without choosing one.</p>
          <div className="mt-4 space-y-3">
            {adhdSelected ? (
              <button
                type="button"
                aria-pressed="true"
                onClick={() => toggle("adhd")}
                className="relative flex w-full flex-col gap-4 rounded-xl border-2 border-violet-500 bg-violet-50 px-4 py-4 text-left sm:flex-row sm:items-center"
              >
                <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-violet-600 text-white">
                  <Check size={14} aria-hidden="true" />
                </span>
                <span className="flex w-24 flex-col items-center gap-2">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-100 text-violet-700">
                    <Brain size={20} aria-hidden="true" />
                  </span>
                  <span className="font-semibold">ADHD</span>
                </span>
                <span className="space-y-2 pr-6 text-sm text-slate-800">
                  <span className="flex gap-2">
                    <Pill size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                    We prescribe ADHD medications including adderall, with stringent clinical standards
                  </span>
                  <span className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    We offer free, FDA-approved online ADHD testing (QbCheck®)
                  </span>
                </span>
              </button>
            ) : null}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {choices.map((condition) => {
                const selected = data.conditions.includes(condition.id);
                const Icon = CONDITION_ICONS[condition.id];
                return (
                  <button
                    key={condition.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(condition.id)}
                    className={`relative flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border bg-white px-2 py-3 text-center ${
                      selected ? "border-violet-500 ring-1 ring-violet-500" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-full ${
                        selected ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{condition.label}</span>
                  </button>
                );
              })}
            </div>
            {data.conditions.includes("other") ? (
              <label className="block text-sm font-medium text-slate-800">
                In your own words
                <input
                  value={data.otherCondition}
                  onChange={(event) => patch({ otherCondition: event.target.value })}
                  placeholder="Optional"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </label>
            ) : null}
          </div>
        </div>
        <div className="mt-6">
          <PrimaryButton onClick={continueStep}>Continue</PrimaryButton>
        </div>
      </SectionCard>
      <ResumeCard />
    </>
  );
}
