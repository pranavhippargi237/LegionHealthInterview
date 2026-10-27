import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { parseDate, todayISO } from "./format";
import type { GenderFilter, OnboardingData, TimeOfDay, YesNo } from "./types";

const KEY = "legion-onboarding-v2";

export function initialData(): OnboardingData {
  return {
    step: 0,
    maxReached: 0,
    texas: null,
    medicare: null,
    crisis: null,
    hospitalized: null,
    adult: null,
    virtualOnly: null,
    preferredDate: null,
    timeOfDay: "any",
    genderFilter: "any",
    conditions: [],
    otherCondition: "",
    insurance: null,
    bcbsState: "Texas",
    otherInsurance: "",
    help: null,
    providerId: null,
    slotId: null,
    wantEarlier: false,
    rescheduleWith: "current",
    specificProviderIds: [],
    availabilityNote: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    referral: "",
    consentTos: false,
    consentTreatment: false,
    consentRecording: false,
    matchReady: false,
    extraShown: 0,
    last4: "",
    booked: false,
    banner: "",
  };
}

function clampStep(value: unknown) {
  return typeof value === "number" && value >= 0 && value <= 5 ? Math.floor(value) : 0;
}

function yesNo(value: unknown): YesNo {
  return value === "yes" || value === "no" ? value : null;
}

function timeOfDay(value: unknown): TimeOfDay {
  return value === "morning" || value === "afternoon" || value === "evening" || value === "any"
    ? value
    : "any";
}

function genderFilter(value: unknown): GenderFilter {
  return value === "woman" || value === "man" || value === "nonbinary" || value === "any" ? value : "any";
}

export function fitReady(data: OnboardingData) {
  return (
    data.texas === "yes" &&
    data.medicare === "no" &&
    data.crisis === "no" &&
    data.hospitalized === "no" &&
    data.adult === "yes" &&
    data.virtualOnly === "yes"
  );
}

function yearsOld(iso: string) {
  const born = parseDate(iso);
  const now = parseDate(todayISO());
  let years = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) years -= 1;
  return years;
}

function hydrate(): OnboardingData {
  const base = initialData();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<OnboardingData>;
    const step = clampStep(parsed.step);
    const maxReached = Math.max(clampStep(parsed.maxReached), step);
    return {
      ...base,
      ...parsed,
      conditions: Array.isArray(parsed.conditions)
        ? parsed.conditions.filter((item) => typeof item === "string")
        : [],
      specificProviderIds: Array.isArray(parsed.specificProviderIds)
        ? parsed.specificProviderIds.filter((item) => typeof item === "string")
        : [],
      step,
      maxReached,
      texas: yesNo(parsed.texas),
      medicare: yesNo(parsed.medicare),
      crisis: yesNo(parsed.crisis),
      hospitalized: yesNo(parsed.hospitalized),
      adult: yesNo(parsed.adult),
      virtualOnly: yesNo(parsed.virtualOnly),
      preferredDate: typeof parsed.preferredDate === "string" ? parsed.preferredDate : null,
      timeOfDay: timeOfDay(parsed.timeOfDay),
      genderFilter: genderFilter(parsed.genderFilter),
      banner: "",
      booked: Boolean(parsed.booked),
    };
  } catch {
    return base;
  }
}

export function infoProblems(data: OnboardingData) {
  const problems: string[] = [];
  if (!data.firstName.trim()) problems.push("Enter your first name.");
  if (!data.lastName.trim()) problems.push("Enter your last name.");
  if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) problems.push("Enter a valid email address.");
  if (data.phone.replace(/\D/g, "").length !== 10) problems.push("Enter a 10-digit phone number.");
  if (!data.dob) problems.push("Enter your date of birth.");
  else if (data.dob > todayISO()) problems.push("Birth date cannot be in the future.");
  else if (yearsOld(data.dob) < 18) problems.push("This care is for adults 18 and older.");
  if (!data.referral) problems.push("Tell us how you first heard about Legion Health.");
  if (!data.consentTos || !data.consentTreatment || !data.consentRecording) {
    problems.push("Please agree to all three policies to continue.");
  }
  return problems;
}

export function firstIncomplete(data: OnboardingData) {
  if (!fitReady(data)) return 0;
  if (!data.insurance) return 1;
  if (!data.help) return 2;
  if (!data.providerId || !data.slotId) return 3;
  if (infoProblems(data).length > 0) return 4;
  return null;
}

type Action = { type: "patch"; patch: Partial<OnboardingData> } | { type: "reset" };

function reducer(state: OnboardingData, action: Action): OnboardingData {
  if (action.type === "reset") return initialData();
  const next = { ...state, ...action.patch };
  if (typeof action.patch.step === "number") {
    next.maxReached = Math.max(state.maxReached, action.patch.step);
  }
  return next;
}

type OnboardingApi = {
  data: OnboardingData;
  patch: (patch: Partial<OnboardingData>) => void;
  go: (step: number) => void;
  reset: () => void;
  completeBooking: (last4: string) => void;
  resume: (email: string) => "empty" | "missing" | "ok";
};

const OnboardingContext = createContext<OnboardingApi | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, hydrate);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify({ ...data, banner: "" }));
  }, [data]);

  const patch = useCallback((partial: Partial<OnboardingData>) => {
    dispatch({ type: "patch", patch: partial });
  }, []);

  const go = useCallback((target: number) => {
    const current = dataRef.current;
    const incomplete = firstIncomplete(current);
    if (incomplete !== null && target > incomplete) {
      dispatch({
        type: "patch",
        patch: { step: incomplete, banner: "Finish this step before moving on." },
      });
      return;
    }
    dispatch({
      type: "patch",
      patch: {
        step: target,
        banner: "",
        booked: target === 5 ? current.booked : false,
      },
    });
  }, []);

  const reset = useCallback(() => {
    sessionStorage.removeItem(KEY);
    dispatch({ type: "reset" });
  }, []);

  const completeBooking = useCallback((last4: string) => {
    dispatch({
      type: "patch",
      patch: { last4, booked: true, step: 5, banner: "" },
    });
  }, []);

  const resume = useCallback((email: string) => {
    const current = dataRef.current;
    if (!current.email.trim()) return "empty";
    if (current.email.trim().toLowerCase() !== email.trim().toLowerCase()) return "missing";
    dispatch({
      type: "patch",
      patch: { step: current.maxReached, banner: "", booked: false },
    });
    return "ok";
  }, []);

  const api = useMemo(
    () => ({ data, patch, go, reset, completeBooking, resume }),
    [data, patch, go, reset, completeBooking, resume],
  );

  return <OnboardingContext.Provider value={api}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within OnboardingProvider");
  return context;
}

type DialogApi = {
  openPolicy: (id: string) => void;
  openHelp: () => void;
  openSignIn: () => void;
};

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DialogApi;
}) {
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function useDialogs() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialogs must be used within DialogProvider");
  return context;
}

export function useDialogState() {
  const [policy, setPolicy] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  const api = useMemo<DialogApi>(
    () => ({
      openPolicy: setPolicy,
      openHelp: () => setHelpOpen(true),
      openSignIn: () => setSignInOpen(true),
    }),
    [],
  );

  return { policy, setPolicy, helpOpen, setHelpOpen, signInOpen, setSignInOpen, api };
}
