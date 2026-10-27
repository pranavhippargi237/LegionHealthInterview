import { useCallback, useEffect, useState } from "react";
import { POLICIES, STEPS } from "./data";
import { Shell } from "./components/Shell";
import { Modal, PrimaryButton, inputClass } from "./components/ui";
import {
  DialogProvider,
  OnboardingProvider,
  useDialogState,
  useOnboarding,
} from "./state";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { ConfirmationStep } from "./steps/ConfirmationStep";
import { FitStep } from "./steps/FitStep";
import { HelpStep } from "./steps/HelpStep";
import { InsuranceStep } from "./steps/InsuranceStep";
import { MatchStep } from "./steps/MatchStep";
import { PaymentStep } from "./steps/PaymentStep";

const STEP_VIEWS = [
  FitStep,
  InsuranceStep,
  HelpStep,
  MatchStep,
  BasicInfoStep,
  PaymentStep,
];

function Flow() {
  const { data } = useOnboarding();
  const Step = STEP_VIEWS[data.step] ?? FitStep;

  useEffect(() => {
    document.title = data.booked
      ? "Appointment reserved · Legion Health"
      : `${STEPS[data.step].label} · Legion Health`;
  }, [data.booked, data.step]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [data.step, data.booked]);

  return <Shell>{data.booked ? <ConfirmationStep /> : <Step />}</Shell>;
}

function Dialogs() {
  const { policy, setPolicy, helpOpen, setHelpOpen, signInOpen, setSignInOpen, api } = useDialogState();
  const { resume } = useOnboarding();
  const [email, setEmail] = useState("");
  const [signInMessage, setSignInMessage] = useState("");

  const closePolicy = useCallback(() => setPolicy(null), [setPolicy]);
  const closeHelp = useCallback(() => setHelpOpen(false), [setHelpOpen]);
  const closeSignIn = useCallback(() => {
    setSignInOpen(false);
    setSignInMessage("");
  }, [setSignInOpen]);

  const policyCopy = policy ? POLICIES[policy] : null;

  return (
    <DialogProvider value={api}>
      <Flow />
      {policyCopy ? (
        <Modal title={policyCopy.title} onClose={closePolicy}>
          <div className="space-y-3">
            {policyCopy.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Modal>
      ) : null}
      {helpOpen ? (
        <Modal title="Need help?" onClose={closeHelp}>
          <div className="space-y-3">
            <p>If you are in danger or this is a medical emergency, call 911 now.</p>
            <p>
              If you are thinking about hurting yourself, or you need someone to talk to right now, call or text 988.
              The Suicide & Crisis Lifeline is available 24 hours a day.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <a
                href="tel:911"
                className="flex h-12 items-center justify-center rounded-lg bg-[#16325C] text-sm font-semibold text-white"
              >
                Call 911
              </a>
              <a
                href="tel:988"
                className="flex h-12 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white"
              >
                Call or text 988
              </a>
            </div>
            <p className="border-t border-slate-100 pt-3">
              For help finishing this booking, you can close this and keep going. Your answers stay on this device.
            </p>
          </div>
        </Modal>
      ) : null}
      {signInOpen ? (
        <Modal title="Continue your booking" onClose={closeSignIn}>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const result = resume(email);
              if (result === "ok") {
                closeSignIn();
                setEmail("");
                return;
              }
              setSignInMessage(
                result === "empty"
                  ? "We don't have an email saved on this device yet. Keep going and we'll save your place after you enter one."
                  : "We couldn't find a saved booking for that email on this device.",
              );
            }}
          >
            <p>Enter the email you used on this device. We'll bring you back to where you left off.</p>
            <label className="block font-medium text-slate-800">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="john.doe@example.com"
                className={`${inputClass} mt-1.5 font-normal`}
              />
            </label>
            {signInMessage ? <p role="status">{signInMessage}</p> : null}
            <PrimaryButton type="submit">Find my booking</PrimaryButton>
          </form>
        </Modal>
      ) : null}
    </DialogProvider>
  );
}

export function App() {
  return (
    <OnboardingProvider>
      <Dialogs />
    </OnboardingProvider>
  );
}
