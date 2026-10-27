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
import { AwayFromVisit, ConfirmationStep } from "./steps/ConfirmationStep";
import { ClipboardStep } from "./steps/ClipboardStep";
import { MatchStep } from "./steps/MatchStep";
import { PaymentStep } from "./steps/PaymentStep";

const STEP_VIEWS = [ClipboardStep, MatchStep, BasicInfoStep, PaymentStep];

function Flow() {
  const { data } = useOnboarding();
  const Step = STEP_VIEWS[data.step] ?? ClipboardStep;

  useEffect(() => {
    document.title = !data.booked
      ? `${STEPS[data.step].label} · Legion Health`
      : data.visitPhase === "completed"
        ? "Visit complete · Legion Health"
        : data.visitPhase === "waiting"
          ? "Waiting room · Legion Health"
          : "Your visit · Legion Health";
  }, [data.booked, data.step, data.visitPhase]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [data.step, data.booked, data.rescheduling, data.awayFromVisit, data.visitPhase]);

  const bookedView = data.rescheduling ? (
    <MatchStep />
  ) : data.awayFromVisit ? (
    <AwayFromVisit />
  ) : (
    <ConfirmationStep />
  );

  return <Shell>{data.booked ? bookedView : <Step />}</Shell>;
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
        <Modal title="Need help booking?" onClose={closeHelp}>
          <div className="space-y-3">
            <p>
              This reaches Legion's booking team, for help choosing a time or finishing this form. In this demo, no
              call or message is sent.
            </p>
            <p>Your answers stay on this device. Close this and keep going whenever you are ready.</p>
            <div className="border-t border-slate-100 pt-3">
              <h3 className="font-semibold text-slate-900">Emergency and crisis support</h3>
              <p className="mt-1">
                This is separate from the booking team. If you are in danger, call 911. If you are in crisis or
                thinking about suicide, call or text 988.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
            </div>
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
