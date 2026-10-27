import { useState, type FormEvent } from "react";
import { Calendar } from "lucide-react";
import { REFERRALS } from "../data";
import { formatBirthdate, formatPhone, todayISO } from "../format";
import { infoProblems, useDialogs, useOnboarding } from "../state";
import { FormNote, inputClass, PrimaryButton, ResumeCard, SectionCard, StepHeading } from "../components/ui";

export function BasicInfoStep() {
  const { data, patch } = useOnboarding();
  const { openPolicy } = useDialogs();
  const [errors, setErrors] = useState<string[]>([]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const problems = infoProblems(data);
    if (problems.length > 0) {
      setErrors(problems);
      return;
    }
    patch({ step: 3, banner: "" });
  }

  return (
    <>
      <SectionCard>
        <StepHeading
          title="Tell us about yourself"
          subtitle="We need some basic information to create your account"
        />
        <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
          {errors.length > 0 ? <FormNote messages={errors} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-800">
              First Name
              <input
                value={data.firstName}
                onChange={(event) => patch({ firstName: event.target.value })}
                autoComplete="given-name"
                placeholder="John"
                className={`${inputClass} mt-1.5 font-normal`}
              />
            </label>
            <label className="block text-sm font-medium text-slate-800">
              Last Name
              <input
                value={data.lastName}
                onChange={(event) => patch({ lastName: event.target.value })}
                autoComplete="family-name"
                placeholder="Doe"
                className={`${inputClass} mt-1.5 font-normal`}
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-800">
            Email
            <input
              type="email"
              value={data.email}
              onChange={(event) => patch({ email: event.target.value })}
              autoComplete="email"
              placeholder="john.doe@example.com"
              className={`${inputClass} mt-1.5 font-normal`}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-800">
              Phone Number
              <input
                type="tel"
                inputMode="tel"
                value={data.phone}
                onChange={(event) => patch({ phone: formatPhone(event.target.value) })}
                autoComplete="tel"
                placeholder="(555) 123-4567"
                className={`${inputClass} mt-1.5 font-normal`}
              />
            </label>
            <label className="block text-sm font-medium text-slate-800" htmlFor="dob">
              Date of Birth
              <span className="relative mt-1.5 block">
                <input
                  id="dob"
                  type="date"
                  value={data.dob}
                  max={todayISO()}
                  onChange={(event) => patch({ dob: event.target.value })}
                  className={`${inputClass} date-field text-transparent`}
                />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 text-sm font-normal">
                  <span className={data.dob ? "text-slate-900" : "text-slate-400"}>
                    {data.dob ? formatBirthdate(data.dob) : "Select your birth date"}
                  </span>
                  <Calendar size={16} className="text-slate-500" aria-hidden="true" />
                </span>
              </span>
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-800">
            How did you first hear about Legion Health?
            <select
              value={data.referral}
              onChange={(event) => patch({ referral: event.target.value })}
              className={`${inputClass} mt-1.5 font-normal`}
            >
              <option value="">Select an option</option>
              {REFERRALS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <div className="space-y-3 pt-1 text-sm text-slate-800">
            <div className="flex items-start gap-2.5">
              <input
                id="consent-tos"
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#2F6BFF]"
                checked={data.consentTos}
                aria-labelledby="consent-tos-text"
                onChange={(event) => patch({ consentTos: event.target.checked })}
              />
              <p id="consent-tos-text">
                I agree to the Legion Health{" "}
                <button type="button" className="font-medium text-brand underline" onClick={() => openPolicy("tos")}>
                  Terms of Service
                </button>
                ,{" "}
                <button type="button" className="font-medium text-brand underline" onClick={() => openPolicy("tos")}>
                  Privacy Policy
                </button>
                , and{" "}
                <button type="button" className="font-medium text-brand underline" onClick={() => openPolicy("tos")}>
                  HIPAA Notice
                </button>
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <input
                id="consent-treatment"
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#2F6BFF]"
                checked={data.consentTreatment}
                aria-labelledby="consent-treatment-text"
                onChange={(event) => patch({ consentTreatment: event.target.checked })}
              />
              <p id="consent-treatment-text">
                I agree to the Legion Health{" "}
                <button
                  type="button"
                  className="font-medium text-brand underline"
                  onClick={() => openPolicy("treatment")}
                >
                  Treatment Consent Policy
                </button>
                , and{" "}
                <button
                  type="button"
                  className="font-medium text-brand underline"
                  onClick={() => openPolicy("treatment")}
                >
                  Controlled Substance Policy
                </button>
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <input
                id="consent-recording"
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#2F6BFF]"
                checked={data.consentRecording}
                aria-labelledby="consent-recording-text"
                onChange={(event) => patch({ consentRecording: event.target.checked })}
              />
              <p id="consent-recording-text">
                I agree to the{" "}
                <button
                  type="button"
                  className="font-medium text-brand underline"
                  onClick={() => openPolicy("recording")}
                >
                  Recording & AI Transcription Policy
                </button>
              </p>
            </div>
          </div>
          <PrimaryButton type="submit">Save my info & Continue</PrimaryButton>
        </form>
      </SectionCard>
      <ResumeCard />
    </>
  );
}
