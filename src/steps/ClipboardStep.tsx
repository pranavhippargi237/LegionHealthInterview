import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { BCBS_STATES, CONDITIONS, HELP_OPTIONS, INSURERS } from "../data";
import { clipboardReady, fitReady, paymentReady, useOnboarding } from "../state";
import type { FitKey, YesNo } from "../types";
import { InsurerLogo } from "../components/InsurerLogo";
import { NextSteps } from "../components/NextSteps";
import { CrisisLine, FormNote, PrimaryButton } from "../components/ui";

const QUESTIONS: { key: FitKey; title: string; body: string }[] = [
  {
    key: "texas",
    title: "Will you be in Texas for your appointment?",
    body: "Legion currently sees people who will be in Texas for the visit.",
  },
  {
    key: "adult",
    title: "Are you 18 years or older?",
    body: "This care is for adults 18 and older.",
  },
  {
    key: "virtualOnly",
    title: "Are you looking for virtual care only?",
    body: "Every Legion visit happens online.",
  },
  {
    key: "medicare",
    title: "Do you currently have Medicaid or Medicare as your insurance?",
    body: "We can't bill Medicaid or Medicare, including if you planned to pay yourself.",
  },
  {
    key: "crisis",
    title: "Are you currently at risk of harming yourself or others?",
    body: "If you are in crisis, we'll point you to immediate support instead of booking.",
  },
  {
    key: "hospitalized",
    title: "Have you been hospitalized for mental health or substance use in the past year?",
    body: "A recent hospital stay may mean a different level of care is a better fit.",
  },
];

const EXCLUSIVE = new Set(["unsure", "private"]);
const LISTED = INSURERS.filter((item) => item.id !== "other" && item.id !== "none");

function Choice({
  label,
  pressed,
  onClick,
  fixed = false,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  fixed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        fixed ? "h-11 w-[88px]" : "h-10 px-4"
      } ${
        pressed ? "border-[#0B6B3A] bg-[#0F7A4A] text-white" : "border-slate-900 bg-white text-slate-900 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function Resource({ title, action, href, detail }: { title: string; action: string; href: string; detail: string }) {
  const external = href.startsWith("http");
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
      <p className="font-semibold text-slate-900">{title}</p>
      <a href={href} className="font-medium text-brand underline" {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {action}
      </a>
      <p className="text-sm text-slate-600">{detail}</p>
    </div>
  );
}

export function ClipboardStep() {
  const { data, patch, reachFitQuestion } = useOnboarding();
  const [error, setError] = useState("");
  const ready = clipboardReady(data);

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-fit-question]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const key = entry.target.getAttribute("data-fit-question");
          if (key) reachFitQuestion(key as FitKey);
        }
      },
      { threshold: 0.4 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [reachFitQuestion]);

  function setAnswer(key: FitKey, value: YesNo) {
    patch({ [key]: value, fitContinued: false, banner: "" });
    setError("");
  }

  function toggleCondition(id: string) {
    if (EXCLUSIVE.has(id)) {
      patch({ conditions: data.conditions.includes(id) ? [] : [id], otherCondition: "", banner: "" });
      return;
    }
    const withoutExclusive = data.conditions.filter((item) => !EXCLUSIVE.has(item));
    const conditions = withoutExclusive.includes(id)
      ? withoutExclusive.filter((item) => item !== id)
      : [...withoutExclusive, id];
    patch({ conditions, banner: "" });
  }

  function findAppointment() {
    if (!ready) {
      const missing = QUESTIONS.filter((question) => data[question.key] === null).map((question) => question.title);
      if (!paymentReady(data)) missing.push("How would you like to pay?");
      if (!data.help) missing.push("How can we help you?");
      setError(
        missing.length
          ? `Still to answer: ${missing.join("; ")}`
          : "One of the answers above points to a different kind of support. Use those resources, or change the answer if it was a mistake.",
      );
      return;
    }
    if (!fitReady(data)) return;
    patch({ step: 1, fitContinued: true, banner: "" });
  }

  const usingListed = Boolean(data.insurance && LISTED.some((item) => item.id === data.insurance));
  const requiredAnswers = [
    ...QUESTIONS.map((question) => data[question.key] !== null),
    paymentReady(data),
    Boolean(data.help),
  ];
  const requiredAnswered = requiredAnswers.filter(Boolean).length;

  return (
    <div className="mx-auto grid w-full max-w-[1248px] items-start gap-8 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
      <NextSteps answered={requiredAnswered} total={requiredAnswers.length} />
      <div className="min-w-0 min-[1100px]:order-1">
        <h1 className="text-balance text-[28px] font-bold tracking-tight text-slate-900">Initial questions</h1>
        <CrisisLine />
        <section className="mt-4 rounded-xl bg-[#F3F7FD] px-4 py-4 text-sm leading-relaxed text-slate-700">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Info size={16} aria-hidden="true" /> Your safety and care come first
          </h2>
          <p className="mt-1">
            If a safety answer points somewhere else, that is about finding the right level of care. Those resources stay
            on this page.
          </p>
        </section>

      {error ? (
        <div className="mt-4">
          <FormNote messages={[error]} />
        </div>
      ) : null}

      <section className="mt-[1.05rem] max-w-[896px]">
        <h2 className="text-lg font-bold text-slate-900">Qualifications</h2>
        <div className="mt-[0.35rem] divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-4">
          {QUESTIONS.slice(0, 4).map((question) => (
            <QuestionCard key={question.key} question={question} value={data[question.key]} onAnswer={setAnswer} compact />
          ))}
        </div>
      </section>

      <section className="mt-[1.05rem] max-w-[896px]">
        <h2 className="text-lg font-bold text-slate-900">Safety</h2>
        <div className="mt-[0.35rem] divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-4">
          {QUESTIONS.slice(4).map((question) => (
            <QuestionCard key={question.key} question={question} value={data[question.key]} onAnswer={setAnswer} compact />
          ))}
        </div>
      </section>

      <section className="mt-[1.05rem] max-w-[896px] rounded-xl border border-slate-200 bg-white px-4 py-4">
        <h2 className="text-base font-semibold text-slate-900">How would you like to pay?</h2>
        <p className="mt-[0.175rem] text-sm leading-snug text-slate-600">
          You are choosing how to pay for a visit. Selecting an insurance company means using a plan you already have.
          You are not buying insurance through this form.
        </p>
        <div className="mt-[0.525rem] overflow-x-auto">
          <table className="w-full table-fixed border-collapse border-2 border-slate-900 text-left text-sm">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[64%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="border-b-2 border-slate-900 bg-[#16325C] text-white">
                <th scope="col" className="border border-slate-900 px-3 py-3 font-semibold">Payment option</th>
                <th scope="col" className="border border-slate-900 px-3 py-3 font-semibold">What I can select</th>
                <th scope="col" className="border border-slate-900 px-3 py-3 font-semibold">What I should understand</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-900 align-top">
                <th scope="row" className={`border border-slate-900 px-3 py-3 font-semibold text-slate-900 ${usingListed ? "bg-[#E8F7EE]" : ""}`}>
                  Use my insurance
                </th>
                <td className={`border border-slate-900 px-3 py-3 ${usingListed ? "bg-[#E8F7EE]" : ""}`}>
                  <div className="grid grid-cols-2 gap-2">
                    {LISTED.map((insurer) => {
                      const selected = data.insurance === insurer.id;
                      return (
                        <button
                          key={insurer.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            patch({ insurance: insurer.id, banner: "" });
                            setError("");
                          }}
                          className={`inline-flex h-14 w-full items-center justify-center rounded-lg border-0 px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                            selected ? "bg-[#0F7A4A]" : "bg-white"
                          }`}
                        >
                          <InsurerLogo id={insurer.id} />
                          <span className="sr-only">{insurer.short}</span>
                        </button>
                      );
                    })}
                  </div>
                  {data.insurance === "bcbs" ? (
                    <label className="mt-2 block text-xs font-medium text-slate-700">
                      Blue Cross Blue Shield state
                      <select
                        value={data.bcbsState}
                        onChange={(event) => patch({ bcbsState: event.target.value })}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm"
                      >
                        {BCBS_STATES.map((state) => (
                          <option key={state}>{state}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </td>
                <td className={`border border-slate-900 px-3 py-3 text-sm leading-snug text-slate-800 ${usingListed ? "bg-[#E8F7EE] font-semibold" : ""}`}>
                  The current prototype’s $0–$40 range is an estimate for a visit. Your actual cost needs benefits
                  verification. Selecting a company does not mean the visit is covered.
                </td>
              </tr>
              <tr className="border-b border-slate-900 align-top">
                <th
                  scope="row"
                  className={`border border-slate-900 px-3 py-3 font-semibold text-slate-900 ${data.insurance === "other" ? "bg-[#E8F7EE]" : ""}`}
                >
                  Check another insurance plan
                </th>
                <td className={`border border-slate-900 px-3 py-3 ${data.insurance === "other" ? "bg-[#E8F7EE]" : ""}`}>
                  <button
                    type="button"
                    aria-pressed={data.insurance === "other"}
                    onClick={() => {
                      patch({ insurance: "other", banner: "" });
                      setError("");
                    }}
                    className={`h-10 w-full rounded-lg border-0 px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      data.insurance === "other" ? "bg-[#0F7A4A] text-white" : "bg-transparent text-slate-900"
                    }`}
                  >
                    Other insurance
                  </button>
                  {data.insurance === "other" ? (
                    <label className="mt-2 block text-xs font-medium text-slate-700">
                      Plan name
                      <input
                        value={data.otherInsurance}
                        onChange={(event) => patch({ otherInsurance: event.target.value, insurance: "other" })}
                        placeholder="Plan name on your card"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal"
                      />
                    </label>
                  ) : null}
                </td>
                <td
                  className={`border border-slate-900 px-3 py-3 text-sm leading-snug text-slate-800 ${data.insurance === "other" ? "bg-[#E8F7EE] font-semibold" : ""}`}
                >
                  The cost is unknown until coverage is checked. Choosing this does not automatically enroll you in
                  self-pay.
                </td>
              </tr>
              <tr className="align-top">
                <th
                  scope="row"
                  className={`border border-slate-900 px-3 py-3 font-semibold text-slate-900 ${data.insurance === "none" ? "bg-[#E8F7EE]" : ""}`}
                >
                  Pay without insurance
                </th>
                <td className={`border border-slate-900 px-3 py-3 ${data.insurance === "none" ? "bg-[#E8F7EE]" : ""}`}>
                  <button
                    type="button"
                    aria-pressed={data.insurance === "none"}
                    onClick={() => {
                      patch({ insurance: "none", banner: "" });
                      setError("");
                    }}
                    className={`h-10 w-full rounded-lg border-0 px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      data.insurance === "none" ? "bg-[#0F7A4A] text-white" : "bg-transparent text-slate-900"
                    }`}
                  >
                    Self-pay
                  </button>
                </td>
                <td
                  className={`border border-slate-900 px-3 py-3 text-sm leading-snug text-slate-800 ${data.insurance === "none" ? "bg-[#E8F7EE] font-semibold" : ""}`}
                >
                  The quoted demo prices are $250 for the first visit and $150 for follow-ups.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {usingListed ? (
          <p className="mt-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Verification status:</span> Not verified. The $0–$40 figure is
            a prototype estimate, not a coverage decision.
          </p>
        ) : null}
        {data.insurance === "other" ? (
          <p className="mt-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Verification status:</span> Not verified. Cost stays unknown
            until this plan is checked.
          </p>
        ) : null}
        {data.insurance === "none" ? (
          <p className="mt-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Verification status:</span> Not needed. These are prototype
            self-pay prices, not verified benefits.
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-slate-900">How can we help you?</h2>
        <div className="mt-3 space-y-2">
          {HELP_OPTIONS.map((option) => {
            const selected = data.help === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  patch({ help: option.id, banner: "" });
                  setError("");
                }}
                className={`w-full rounded-xl border px-4 py-3 text-left ${
                  selected ? "border-brand bg-blue-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="block text-sm font-semibold text-slate-900">{option.title}</span>
                <span className="mt-1 block text-sm text-slate-600">{option.detail}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-5 text-sm leading-relaxed text-slate-600">
          If there’s a condition or diagnosis you’d like help with, you can select it below.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONDITIONS.map((condition) => {
            const selected = data.conditions.includes(condition.id);
            return (
              <button
                key={condition.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleCondition(condition.id)}
                className={`h-10 rounded-full border px-3 text-sm font-medium ${
                  selected ? "border-brand bg-brand text-white" : "border-slate-200 text-slate-800"
                }`}
              >
                {condition.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">You can continue without selecting a diagnosis.</p>
        {data.conditions.includes("adhd") ? (
          <div className="mt-3 rounded-lg bg-[#F3F7FD] px-3 py-3 text-sm leading-relaxed text-slate-700">
            <p className="font-semibold text-slate-900">About ADHD care</p>
            <p className="mt-1">
              Clinicians here can discuss ADHD medication, including Adderall, using the practice’s clinical standards.
              A free online ADHD test, QbCheck, is also available. This note is only here because you selected ADHD.
            </p>
          </div>
        ) : null}
      </section>

      {ready ? (
        <section className="mt-4 rounded-xl bg-[#F3F7FD] px-4 py-5">
          <h2 className="text-lg font-bold text-slate-900">Thanks. Let's find a time for your first visit.</h2>
        </section>
      ) : null}

      <div className="mt-4 pb-12">
        <PrimaryButton onClick={findAppointment}>Find an appointment</PrimaryButton>
      </div>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  value,
  onAnswer,
  compact = false,
}: {
  question: (typeof QUESTIONS)[number];
  value: YesNo;
  onAnswer: (key: FitKey, value: YesNo) => void;
  compact?: boolean;
}) {
  const followUp = (
    <>
      {question.key === "texas" && value === "no" ? (
        <p className="mt-3 rounded-lg bg-[#E8F0FE] px-3 py-3 text-sm leading-relaxed text-[#1E3A5F]">
          Legion currently cares for people who will be in Texas for the visit. Choose Yes if that is you.
        </p>
      ) : null}
      {question.key === "medicare" && value === "yes" ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm leading-relaxed text-slate-700">
            We can't bill Medicaid or Medicare, including if you planned to pay yourself.
          </p>
          <Resource
            title="Medicare"
            action="Search Medicare Care Compare"
            href="https://www.medicare.gov/care-compare/"
            detail="Find clinicians and facilities that take Medicare."
          />
          <Resource
            title="Medicaid"
            action="Find your state Medicaid agency"
            href="https://www.medicaid.gov/about-us/contact-us/index.html"
            detail="Your state agency can help you find covered care."
          />
        </div>
      ) : null}
      {question.key === "crisis" && value === "yes" ? (
        <div className="mt-3 space-y-2 rounded-xl border border-[#BFDBFE] bg-[#F3F7FD] p-3">
          <h4 className="font-semibold text-slate-900">Immediate crisis support</h4>
          <Resource title="988 Suicide & Crisis Lifeline" action="Call or text 988" href="tel:988" detail="Free, confidential support 24/7." />
          <Resource title="Crisis Text Line" action="Text HOME to 741741" href="sms:741741?body=HOME" detail="Free crisis counseling by text." />
          <Resource title="Emergency services" action="Call 911" href="tel:911" detail="For an immediate life-threatening emergency." />
        </div>
      ) : null}
      {question.key === "hospitalized" && value === "yes" ? (
        <div className="mt-3 space-y-2">
          <Resource title="SAMHSA National Helpline" action="1-800-662-4357" href="tel:18006624357" detail="Free treatment referral." />
          <Resource title="FindTreatment.gov" action="Visit findtreatment.gov" href="https://findtreatment.gov" detail="Locate intensive treatment nearby." />
        </div>
      ) : null}
      {question.key === "adult" && value === "no" ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          This practice is for adults 18 and older. A parent or guardian can ask a pediatrician for care. You can also{" "}
          <a className="font-medium text-brand underline" href="tel:988">
            call or text 988
          </a>
          .
        </p>
      ) : null}
      {question.key === "virtualOnly" && value === "no" ? (
        <p className="mt-3 rounded-lg bg-[#E8F0FE] px-3 py-3 text-sm leading-relaxed text-[#1E3A5F]">
          Every Legion visit is virtual. Choose Yes if that works. If you need an office visit, your insurance or
          primary care clinician can help you find a local practice.
        </p>
      ) : null}
    </>
  );

  if (compact) {
    return (
      <section data-fit-question={question.key} className="py-[18px]">
        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_max-content] sm:gap-5">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">{question.title}</h3>
            <p className="mt-0.5 text-sm leading-snug text-slate-600">{question.body}</p>
          </div>
          <div className="flex justify-start gap-[10px]">
            <Choice fixed label="Yes" pressed={value === "yes"} onClick={() => onAnswer(question.key, "yes")} />
            <Choice fixed label="No" pressed={value === "no"} onClick={() => onAnswer(question.key, "no")} />
          </div>
        </div>
        {followUp}
      </section>
    );
  }

  return (
    <section data-fit-question={question.key} className="rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
      <h3 className="text-base font-semibold text-slate-900">{question.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{question.body}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Choice label="Yes" pressed={value === "yes"} onClick={() => onAnswer(question.key, "yes")} />
        <Choice label="No" pressed={value === "no"} onClick={() => onAnswer(question.key, "no")} />
      </div>
      {followUp}
    </section>
  );
}
