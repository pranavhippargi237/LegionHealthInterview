import { useEffect, useState } from "react";
import { ChevronDown, Info, Lock, ShieldCheck, X } from "lucide-react";
import { findProvider, findSlot } from "../data";
import { digits, formatCard, formatClock, formatExpiry, formatTimeUpper, parseDate } from "../format";
import { useDialogs, useOnboarding } from "../state";
import { CardLogo } from "../components/CardLogo";
import { VisitCost } from "../components/VisitCost";
import { inputClass } from "../components/ui";

function cardIsValid(number: string, expiry: string, cvc: string, zip: string) {
  const pan = digits(number);
  if (pan.length !== 15 && pan.length !== 16) return false;
  const exp = digits(expiry);
  if (exp.length !== 4) return false;
  const month = Number(exp.slice(0, 2));
  const year = Number(`20${exp.slice(2)}`);
  if (month < 1 || month > 12) return false;
  if (new Date(year, month, 1) <= new Date()) return false;
  if (digits(cvc).length < 3) return false;
  if (digits(zip).length < 5) return false;
  return true;
}

export function PaymentStep() {
  const { data, go, completeBooking } = useOnboarding();
  const { openPolicy } = useDialogs();
  const provider = findProvider(data.providerId);
  const slot = findSlot(provider, data.slotId);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [zip, setZip] = useState("");
  const [seconds, setSeconds] = useState(10 * 60);
  const [toast, setToast] = useState(true);
  const [protectionOpen, setProtectionOpen] = useState(false);
  const [expectOpen, setExpectOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setToast(false), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!provider || !slot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold">Choose a time first</h1>
        <p className="mt-2 text-sm text-slate-600">An appointment time is required before payment.</p>
        <button type="button" className="mt-4 h-12 rounded-lg bg-brand px-5 font-semibold text-white" onClick={() => go(1)}>
          Back to scheduling
        </button>
      </div>
    );
  }

  const when = parseDate(slot.date);
  const valid = cardIsValid(number, expiry, cvc, zip);
  const weekday = when.toLocaleDateString("en-US", { weekday: "long" });

  function autofill() {
    setNumber(formatCard("4242424242424242"));
    setExpiry("12/28");
    setCvc("123");
    setZip("10001");
  }

  function complete() {
    if (!valid) return;
    completeBooking(digits(number).slice(-4));
  }

  return (
    <div className="pb-[15%]">
      <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Complete Your Booking</h1>
      <p className="mt-1 text-sm text-slate-600">Pay with a credit or debit card to confirm this visit.</p>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <CalendarMark /> Your Selected Appointment
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {seconds > 0 ? (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0FE] px-3 py-1 text-sm font-semibold text-[#1E3A5F]">
                <Info size={14} aria-hidden="true" />
                {formatClock(seconds)} left to book
              </p>
            ) : (
              <p className="inline-flex items-center gap-2 text-sm text-[#1E3A5F]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0FE] px-3 py-1 font-semibold">
                  <Info size={14} aria-hidden="true" />
                  Hold ended
                </span>
                <button type="button" className="font-semibold text-brand underline" onClick={() => setSeconds(10 * 60)}>
                  Refresh hold
                </button>
              </p>
            )}
            <button
              type="button"
              onClick={() => go(1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300"
            >
              Change Appointment
            </button>
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="w-16 shrink-0 rounded-xl bg-[#E8F0FE] py-2 text-center">
            <div className="text-[11px] font-semibold tracking-wide text-brand">
              {when.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
            </div>
            <div className="text-2xl font-bold text-slate-900">{when.getDate()}</div>
            <div className="text-[11px] font-semibold tracking-wide text-brand">
              {when.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{weekday}</p>
            <p className="text-xl font-bold text-brand">{formatTimeUpper(slot.time)}</p>
            <p className="text-sm text-slate-600">60 minute session</p>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-[11px] font-semibold tracking-wide text-slate-500">YOUR PROVIDER</p>
          <div className="mt-2 flex items-center gap-3">
            <img
              src={provider.photo}
              alt=""
              className="h-14 w-14 rounded-xl object-cover"
            />
            <div>
              <p className="font-semibold text-slate-900">{provider.name}</p>
              <p className="text-sm text-slate-600">{provider.title}</p>
              <p className="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                Intake Appointment
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-[#B9D4F5] bg-[#E8F0FE] px-3 py-3 text-sm leading-relaxed text-[#1E3A5F]">
            <p className="font-semibold text-slate-900">Cancellation policy</p>
            <p className="mt-1">
              Cancel or reschedule online at no charge up to 48 hours before your appointment. Late cancellations
              (within 48 hours) or no-shows (not arriving within 10 minutes) will incur a fee:{" "}
              <span className="font-semibold">$250 for initial visits, $100 for follow-ups</span>.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <ShieldCheck size={20} className="text-[#0F7A4A]" aria-hidden="true" />
          Payment Information
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["visa", "Visa"],
              ["mastercard", "Mastercard"],
              ["amex", "American Express"],
            ] as const
          ).map(([id, label]) => (
            <li key={id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
              <CardLogo id={id} />
              <span className="text-sm font-medium text-slate-800">{label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          Pay with a credit or debit card. Enter the card number, expiration date, security code, and billing ZIP, then
          choose Complete Payment Setup.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#E8F7EE] px-3 py-2 text-sm text-[#166534]">
          <ShieldCheck size={16} aria-hidden="true" />
          Your payment information is encrypted and securely processed by Stripe.
        </div>
        <p className="mt-4 text-sm font-medium text-slate-800">Credit or debit card</p>
        <p className="mt-1 text-sm text-slate-600">
          Use Autofill for a demo card. This preview never sends or stores a card number.
        </p>
        <div className="relative mt-2">
          <input
            inputMode="numeric"
            autoComplete="off"
            aria-label="Card number"
            placeholder="Card number"
            value={number}
            onChange={(event) => setNumber(formatCard(event.target.value))}
            className={`${inputClass} pr-28`}
          />
          <button
            type="button"
            onClick={autofill}
            className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md bg-[#0F7A4A] px-2 py-1 text-xs font-semibold text-white"
          >
            Autofill
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <input
            inputMode="numeric"
            autoComplete="off"
            aria-label="Expiration date"
            placeholder="MM/YY"
            value={expiry}
            onChange={(event) => setExpiry(formatExpiry(event.target.value))}
            className={inputClass}
          />
          <input
            inputMode="numeric"
            autoComplete="off"
            aria-label="Security code"
            placeholder="CVC"
            value={cvc}
            onChange={(event) => setCvc(digits(event.target.value).slice(0, 4))}
            className={inputClass}
          />
          <input
            inputMode="numeric"
            autoComplete="off"
            aria-label="Billing ZIP code"
            placeholder="ZIP"
            value={zip}
            onChange={(event) => setZip(digits(event.target.value).slice(0, 5))}
            className={inputClass}
          />
        </div>
        {!valid ? (
          <p className="mt-2 text-sm font-medium text-[#1E3A5F]">Please enter your card details to continue</p>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          We will try to authorize your card with a $1 transaction. Your statement description will be getHealthie.com
          - our payment provider.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          By adding your payment method, you agree to our{" "}
          <button type="button" className="font-medium text-brand underline" onClick={() => openPolicy("financial")}>
            financial policy
          </button>
          .
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setNumber("");
              setExpiry("");
              setCvc("");
              setZip("");
            }}
            className="h-11 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || seconds === 0}
            onClick={complete}
            className={`h-11 rounded-lg text-sm font-semibold text-white ${
              valid && seconds > 0 ? "bg-brand hover:bg-brand-dark" : "cursor-not-allowed bg-[#C5D4FA]"
            }`}
          >
            Complete Payment Setup
          </button>
        </div>
      </section>

      <div className="mt-4">
        <VisitCost data={data} />
      </div>

      <section className="mt-4">
        <h2 className="text-lg font-semibold text-slate-900">Payment Info, Policy, and Process</h2>
        <div className="mt-3 rounded-xl bg-slate-50 text-sm leading-relaxed text-slate-700">
          <h3>
            <button
              type="button"
              aria-expanded={protectionOpen}
              onClick={() => setProtectionOpen((open) => !open)}
              className="flex w-full items-center gap-2 px-4 py-4 text-left font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-5"
            >
              <Lock size={16} aria-hidden="true" />
              <span className="flex-1">How your payment info is protected</span>
              <ChevronDown size={18} aria-hidden="true" className={protectionOpen ? "rotate-180" : ""} />
            </button>
          </h3>
          {protectionOpen ? (
            <ul className="list-disc space-y-2 px-4 pb-4 pl-9 sm:px-5 sm:pl-10">
              <li>
                We use industry-standard tokenization to protect your payment information. When you enter your card
                details, they're immediately converted into a secure token by our PCI-compliant payment processor.
              </li>
              <li>
                Your full card number is never stored on our servers. We only keep the last 4 digits for your reference,
                along with the secure token needed to process future charges.
              </li>
              <li>Your data is encrypted in transit and at rest, meeting HIPAA and PCI-DSS compliance standards.</li>
              <li>In this preview, the card stays in your browser for this step only. Nothing is charged or sent.</li>
            </ul>
          ) : null}
        </div>
        <div className="mt-3 rounded-xl border border-slate-200 bg-white text-sm leading-relaxed text-slate-700">
          <h3>
            <button
              type="button"
              aria-expanded={expectOpen}
              onClick={() => setExpectOpen((open) => !open)}
              className="flex w-full items-center gap-2 px-4 py-4 text-left font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-5"
            >
              <span className="flex-1">What to expect</span>
              <ChevronDown size={18} aria-hidden="true" className={expectOpen ? "rotate-180" : ""} />
            </button>
          </h3>
          {expectOpen ? (
            <div className="px-4 pb-4 sm:px-5">
              <ul className="list-disc space-y-3 pl-4">
                <li>
                  <span className="font-semibold text-slate-900">When we charge:</span> Claims are submitted to insurance
                  about 5 days after your visit. Once insurance processes, we'll charge your card on file for any remaining
                  balance and send an itemized invoice for the visit so you know exactly what you are paying for.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Your estimated cost:</span> Based on your insurance coverage,
                  most patients pay $0–$40 per session.* You can request an exact price estimate anytime.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Insurance and Cash Pay:</span> If you do not have eligible
                  insurance coverage at the time of your visit, you will be responsible for the appointment cash pay rate of
                  $250 for Intakes & $150 for Followups.
                </li>
                <li>
                  You are responsible for any amount not covered by your insurance. If you have questions about coverage,
                  please contact your insurance provider.
                </li>
              </ul>
              <button type="button" className="mt-3 font-medium text-brand underline" onClick={() => openPolicy("financial")}>
                Review our financial policy
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 right-4 z-30 w-[min(100%-2rem,300px)] rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-slate-900">Account created</p>
            <button type="button" aria-label="Dismiss notification" onClick={() => setToast(false)}>
              <X size={16} />
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Your account has been created and your progress has been saved. You can return later by logging in with
            your email.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CalendarMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-slate-700">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
