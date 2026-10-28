import { useEffect, useId, useRef, useState } from "react";
import { User } from "lucide-react";
import { useOnboarding } from "../state";

export function ProfileMenu() {
  const { data } = useOnboarding();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const name = [data.firstName, data.lastName].map((part) => part.trim()).filter(Boolean).join(" ");
  const email = data.email.trim();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Your profile"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <User size={18} aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={panelId}
          className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
        >
          <p className="text-sm font-semibold text-slate-900">Your profile</p>
          {name ? <p className="mt-2 text-sm text-slate-900">{name}</p> : null}
          {email ? <p className="text-sm text-slate-700">{email}</p> : null}
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {name || email
              ? "This profile stays available from this icon."
              : "Your profile is created when you book. Your name and email will show here."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
