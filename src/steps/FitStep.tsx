import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { fitReady, useOnboarding } from "../state";
import type { FitKey, YesNo } from "../types";
import { FormNote, PrimaryButton } from "../components/ui";

type AnswerKey = FitKey;

const QUESTIONS: { key: AnswerKey; title: string; body: string }[] = [
  {
    key: "texas",
    title: "Are you based in Texas?",
    body: "We're thrilled to support Texans right now. If you'd prefer care in another state, select No and we'll point you to resources that can help you.",
  },
  {
    key: "medicare",
    title: "Do you currently have Medicaid or Medicare as your insurance?",
    body: "We're unable to serve patients who have Medicaid or Medicare, even on a cash-pay basis. If you have either of these, select Yes and we'll help you find providers who accept your coverage.",
  },
  {
    key: "crisis",
    title: "Are you currently at risk of harming yourself or others?",
    body: "If you're currently thinking about harming yourself or others, please select Yes and we'll connect you immediately to crisis resources for urgent support.",
  },
  {
    key: "hospitalized",
    title: "Have you been hospitalized for mental health or substance use in the past year?",
    body: "If you've had an inpatient stay in the last year, we may not be the ideal intensity of care. Let's find a program better equipped to support you.",
  },
  {
    key: "adult",
    title: "Are you 18 years or older?",
    body: "Our services are designed for adults 18 and older. If you're under 18 or seeking care for a minor, we'll point you to age-appropriate resources.",
  },
  {
    key: "virtualOnly",
    title: "Are you looking for virtual care only?",
    body: "All sessions happen conveniently online — no travel required. We're here to make medication management accessible and comfortable for you.",
  },
];

function Choice({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`h-11 rounded-lg border text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        pressed ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function Resource({
  title,
  action,
  href,
  detail,
}: {
  title: string;
  action: string;
  href: string;
  detail: string;
}) {
  const external = href.startsWith("http");
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
      <p className="font-semibold text-slate-900">{title}</p>
      <a
        href={href}
        className="font-medium text-brand underline"
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {action}
      </a>
      <p className="text-sm text-slate-600">{detail}</p>
    </div>
  );
}

export function FitStep() {
  const { data, patch, reachFitQuestion } = useOnboarding();
  const [error, setError] = useState("");
  const ready = fitReady(data);
  const answered = QUESTIONS.filter((question) => data[question.key] !== null).length;

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

  function setAnswer(key: AnswerKey, value: YesNo) {
    patch({ [key]: value, fitContinued: false, banner: "" });
    setError("");
  }

  function continueStep() {
    if (!ready) {
      const missing = QUESTIONS.filter((question) => data[question.key] === null).map((question) => question.title);
      setError(
        missing.length
          ? "Answer each question on this page. They are all visible above."
          : "One of the answers above points to a different kind of support. Use those resources, or change the answer if it was a mistake.",
      );
      return;
    }
    patch({ step: 1, fitContinued: true, banner: "" });
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="text-balance text-[28px] font-bold tracking-tight text-slate-900">
          Let's Make Sure We're the Right Fit
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          We want to ensure that you get the best possible care for your current situation. Please read the following
          carefully and only proceed if you are a good fit for the care we provide.
        </p>
        <p className="mt-4 text-sm text-slate-500">{answered} of 6 answered</p>
        <div className="mx-auto mt-2 flex max-w-xs gap-1" aria-hidden="true">
          {QUESTIONS.map((question) => (
            <span
              key={question.key}
              className={`h-1.5 flex-1 rounded-full ${data[question.key] ? "bg-brand" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600">
          After this page: your insurance cost, what kind of care you want, a time that works for you, then booking.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {error ? <FormNote messages={[error]} /> : null}
        {QUESTIONS.map((question, index) => {
          const value = data[question.key];
          return (
            <section
              key={question.key}
              data-fit-question={question.key}
              className="rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5"
            >
              <h2 className="text-base font-semibold text-slate-900">
                <span className="mr-2 text-slate-400">{index + 1}.</span>
                {question.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{question.body}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Choice label="Yes" pressed={value === "yes"} onClick={() => setAnswer(question.key, "yes")} />
                <Choice label="No" pressed={value === "no"} onClick={() => setAnswer(question.key, "no")} />
              </div>
              {question.key === "texas" && value === "no" ? (
                <p className="mt-3 rounded-lg bg-[#E8F0FE] px-3 py-3 text-sm leading-relaxed text-[#1E3A5F]">
                  Legion currently cares for people in Texas. If you live in another state, your insurance member
                  services or your primary care clinician can help you find local care. Choose Yes if you are in Texas.
                </p>
              ) : null}
              {question.key === "medicare" && value === "yes" ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm leading-relaxed text-slate-700">
                    We can't bill Medicaid or Medicare, including if you planned to pay yourself. These directories
                    list clinicians who can.
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
                <div className="mt-3 rounded-xl border border-[#BFDBFE] bg-[#F3F7FD] p-3">
                  <h3 className="font-semibold text-slate-900">Immediate crisis support</h3>
                  <p className="mt-1 text-sm text-slate-700">
                    Please reach out to one of these resources now. They have trained counselors available 24/7.
                  </p>
                  <div className="mt-3 space-y-2">
                    <Resource
                      title="988 Suicide & Crisis Lifeline"
                      action="Call or text 988"
                      href="tel:988"
                      detail="Free, confidential crisis support 24/7."
                    />
                    <Resource
                      title="Crisis Text Line"
                      action="Text HOME to 741741"
                      href="sms:741741?body=HOME"
                      detail="Free crisis counseling by text."
                    />
                    <Resource
                      title="Emergency services"
                      action="Call 911"
                      href="tel:911"
                      detail="For an immediate life-threatening emergency."
                    />
                  </div>
                </div>
              ) : null}
              {question.key === "hospitalized" && value === "yes" ? (
                <div className="mt-3 space-y-2">
                  <h3 className="font-semibold text-slate-900">Specialized treatment resources</h3>
                  <p className="text-sm text-slate-700">
                    Your current needs may require more intensive support. These resources can help you find that care.
                  </p>
                  <Resource
                    title="SAMHSA National Helpline"
                    action="1-800-662-4357"
                    href="tel:18006624357"
                    detail="Free treatment referral for mental health and substance use."
                  />
                  <Resource
                    title="FindTreatment.gov"
                    action="Visit findtreatment.gov"
                    href="https://findtreatment.gov"
                    detail="Locate intensive treatment facilities in your area."
                  />
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm">
                    <p className="font-semibold text-slate-900">Your insurance provider</p>
                    <p className="text-slate-700">Call the number on your insurance card.</p>
                    <p className="text-slate-600">Ask for in-network intensive care programs.</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm">
                    <p className="font-semibold text-slate-900">Your primary care doctor</p>
                    <p className="text-slate-700">Contact your PCP.</p>
                    <p className="text-slate-600">They can refer you to a specialist or a higher level of care.</p>
                  </div>
                  <a
                    href="https://findtreatment.gov"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-12 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white"
                  >
                    Continue to resources
                  </a>
                  <p className="text-center text-xs text-slate-500">
                    Answered by mistake? Choose No above to keep going.
                  </p>
                </div>
              ) : null}
              {question.key === "adult" && value === "no" ? (
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
                  <p>
                    This practice is for adults 18 and older. A parent or guardian can ask a pediatrician for care. You
                    can also call or text 988. That line supports young people too.
                  </p>
                  <a className="font-medium text-brand underline" href="tel:988">
                    Call or text 988
                  </a>
                </div>
              ) : null}
              {question.key === "virtualOnly" && value === "no" ? (
                <p className="mt-3 rounded-lg bg-[#E8F0FE] px-3 py-3 text-sm leading-relaxed text-[#1E3A5F]">
                  Every Legion visit is virtual. If that works for you, choose Yes. If you need to be in an office,
                  your insurance or primary care clinician can help you find a local practice.
                </p>
              ) : null}
            </section>
          );
        })}
      </div>

      <section className="mt-4 rounded-xl bg-[#F3F7FD] px-4 py-4 text-sm leading-relaxed text-slate-700">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Info size={16} aria-hidden="true" /> Your safety and care come first
        </h2>
        <p className="mt-1">
          If any of the above don't apply to you, it doesn't mean you don't deserve care. It means you deserve the
          right kind of care. We'll point you to resources better suited to your current needs.
        </p>
      </section>

      {ready ? (
        <section className="mt-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-5 text-center">
          <h2 className="text-xl font-bold text-slate-900">We're almost done.</h2>
          <p className="mt-1 text-sm text-slate-700">Now, we'll move on to your Care Journey.</p>
        </section>
      ) : null}

      <div className="mt-4">
        <PrimaryButton onClick={continueStep}>Continue</PrimaryButton>
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
        Your responses help us ensure you receive appropriate care. All information is confidential.
      </p>
    </div>
  );
}
