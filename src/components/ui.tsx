import { useEffect, useRef, type ReactNode } from "react";
import { LogIn, X } from "lucide-react";
import { useDialogs } from "../state";

export const inputClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <rect width="36" height="36" rx="11" fill="#2F6BFF" />
        <path
          d="M18 27.2s-7.4-4.5-9.6-8.4C6.4 15.8 7.7 12.4 11.1 12.4c2 0 3.2 1.1 3.9 2.2.7-1.1 1.9-2.2 3.9-2.2 3.4 0 4.7 3.4 2.7 6.4-2.2 3.9-9.6 8.4-9.6 8.4z"
          fill="white"
        />
      </svg>
      <div className="leading-none">
        <div className="text-[22px] font-bold tracking-[-0.045em] text-[#16325C]">legion</div>
        <div className="mt-[3px] text-[9px] font-semibold tracking-[0.28em] text-[#6D86A3]">
          HEALTH
        </div>
      </div>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button, input, select, textarea, a")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
      onMouseDown={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="dialog-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 text-sm leading-relaxed text-slate-700">{children}</div>
      </div>
    </div>
  );
}

export function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-7 sm:px-8">
      {children}
    </section>
  );
}

export function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h1 className="text-balance text-[28px] font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{subtitle}</p>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`h-12 w-full rounded-lg text-[15px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        disabled
          ? "cursor-not-allowed bg-[#C5D4FA] text-white"
          : "bg-brand text-white hover:bg-brand-dark"
      }`}
    >
      {children}
    </button>
  );
}

export function FormNote({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div role="alert" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
      <ul className="list-disc space-y-1 pl-4">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

export function ResumeCard() {
  const { openSignIn } = useDialogs();
  return (
    <button
      type="button"
      onClick={openSignIn}
      className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-6 py-8 text-center hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <LogIn className="mx-auto text-slate-700" aria-hidden="true" />
      <p className="mt-3 font-semibold text-slate-900">Already started your journey?</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-600">
        If you've already entered your email and started filling out forms, sign in to continue
        where you left off.
      </p>
    </button>
  );
}

export function CrisisLine() {
  return (
    <p className="mx-auto mt-8 max-w-[820px] px-5 pb-12 text-sm leading-relaxed text-slate-700">
      If you are in an emergency,{" "}
      <a className="font-semibold text-brand-dark underline" href="tel:911">
        call 911
      </a>
      . If you are in crisis or thinking about suicide,{" "}
      <a className="font-semibold text-brand-dark underline" href="tel:988">
        call or text 988
      </a>
      , the Suicide & Crisis Lifeline.
    </p>
  );
}
