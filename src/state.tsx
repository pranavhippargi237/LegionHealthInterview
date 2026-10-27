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
import { VISIT_TOPIC_IDS } from "./visitNote";
import type {
  FitDecision,
  FitDisposition,
  FitKey,
  FitTrace,
  OnboardingData,
  ProviderGender,
  ScheduleAsk,
  ScheduleResult,
  TimeOfDay,
  YesNo,
} from "./types";

export const FIT_KEYS: FitKey[] = ["texas", "medicare", "crisis", "hospitalized", "adult", "virtualOnly"];

const SCREEN_OUT: Record<FitKey, "yes" | "no"> = {
  texas: "no",
  medicare: "yes",
  crisis: "yes",
  hospitalized: "yes",
  adult: "no",
  virtualOnly: "no",
};

function emptyReached(): Record<FitKey, boolean> {
  return {
    texas: false,
    medicare: false,
    crisis: false,
    hospitalized: false,
    adult: false,
    virtualOnly: false,
  };
}

function explicitDecision(key: FitKey, answer: YesNo): FitDecision {
  if (answer == null) return null;
  return answer === SCREEN_OUT[key] ? "screened_out" : "cleared";
}

export function buildFitTrace(data: Pick<OnboardingData, FitKey | "fitReached" | "fitContinued">): FitTrace {
  const questions = {} as FitTrace["questions"];
  for (const key of FIT_KEYS) {
    const answered = data[key];
    questions[key] = {
      reached: Boolean(data.fitReached?.[key]) || answered != null,
      answered,
      explicitDecision: explicitDecision(key, answered),
    };
  }
  const screenedOut = FIT_KEYS.some((key) => questions[key].explicitDecision === "screened_out");
  const disposition: FitDisposition = screenedOut ? "screened_out" : data.fitContinued ? "continued" : "unfinished";
  return { questions, disposition };
}

const KEY = "legion-onboarding-v3";

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
    timeOfDay: null,
    genderPrefs: [],
    languagePrefs: [],
    backgroundPrefs: [],
    notifyWhenOpen: false,
    scheduleAsks: [],
    fitReached: emptyReached(),
    fitContinued: false,
    fitTrace: buildFitTrace({
      texas: null,
      medicare: null,
      crisis: null,
      hospitalized: null,
      adult: null,
      virtualOnly: null,
      fitReached: emptyReached(),
      fitContinued: false,
    }),
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
    pharmacy: "",
    visitPhase: "upcoming",
    visitDay: false,
    awayFromVisit: false,
    rescheduling: false,
    connectionProblem: false,
    banner: "",
    visitTopics: [],
    visitNote: "",
    visitDraft: "",
    visitWordsSnapshot: "",
    visitSharedNote: "",
  };
}

function clampStep(value: unknown) {
  return typeof value === "number" && value >= 0 && value <= 3 ? Math.floor(value) : 0;
}

function yesNo(value: unknown): YesNo {
  return value === "yes" || value === "no" ? value : null;
}

function timeOfDay(value: unknown): TimeOfDay {
  return value === "morning" || value === "afternoon" || value === "evening" ? value : null;
}

function bandCounts(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const morning = row.morning;
  const afternoon = row.afternoon;
  const evening = row.evening;
  if (typeof morning !== "number" || typeof afternoon !== "number" || typeof evening !== "number") return null;
  return { morning, afternoon, evening };
}

function scheduleResult(value: unknown): ScheduleResult | null {
  return value === "shown" ||
    value === "none_open" ||
    value === "nearby" ||
    value === "help" ||
    value === "notify" ||
    value === "booked"
    ? value
    : null;
}

function scheduleAsks(value: unknown): ScheduleAsk[] {
  if (!Array.isArray(value)) return [];
  const asks: ScheduleAsk[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ScheduleAsk>;
    const result = scheduleResult(row.result);
    const part = timeOfDay(row.timeOfDay);
    const inNext45Days = bandCounts(row.inNext45Days);
    if (!result || !part || !inNext45Days || typeof row.id !== "string" || typeof row.at !== "string") continue;
    if (typeof row.slotsInRequest !== "number") continue;
    asks.push({
      id: row.id,
      at: row.at,
      date: typeof row.date === "string" ? row.date : null,
      timeOfDay: part,
      genders: genderList(row.genders),
      onDay: bandCounts(row.onDay),
      inNext45Days,
      slotsInRequest: row.slotsInRequest,
      result,
    });
  }
  return asks.slice(-40);
}

function fitReached(value: unknown): Record<FitKey, boolean> {
  const base = emptyReached();
  if (!value || typeof value !== "object") return base;
  const row = value as Partial<Record<FitKey, unknown>>;
  for (const key of FIT_KEYS) base[key] = row[key] === true;
  return base;
}

function genderList(value: unknown): ProviderGender[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ProviderGender => item === "woman" || item === "man" || item === "nonbinary");
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
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
    const next: OnboardingData = {
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
      genderPrefs: genderList(parsed.genderPrefs),
      languagePrefs: stringList(parsed.languagePrefs),
      backgroundPrefs: stringList(parsed.backgroundPrefs),
      notifyWhenOpen: parsed.notifyWhenOpen === true,
      scheduleAsks: scheduleAsks(parsed.scheduleAsks),
      fitReached: fitReached(parsed.fitReached),
      fitContinued: parsed.fitContinued === true,
      banner: "",
      booked: Boolean(parsed.booked),
      pharmacy: typeof parsed.pharmacy === "string" ? parsed.pharmacy : "",
      visitPhase:
        parsed.visitPhase === "waiting" || parsed.visitPhase === "completed" ? parsed.visitPhase : "upcoming",
      visitDay: parsed.visitDay === true,
      awayFromVisit: parsed.awayFromVisit === true,
      rescheduling: parsed.rescheduling === true,
      connectionProblem: parsed.connectionProblem === true,
      visitTopics: stringList(parsed.visitTopics).filter((id) => VISIT_TOPIC_IDS.includes(id)),
      visitNote: typeof parsed.visitNote === "string" ? parsed.visitNote : "",
      visitDraft: typeof parsed.visitDraft === "string" ? parsed.visitDraft : "",
      visitWordsSnapshot: typeof parsed.visitWordsSnapshot === "string" ? parsed.visitWordsSnapshot : "",
      visitSharedNote: typeof parsed.visitSharedNote === "string" ? parsed.visitSharedNote : "",
    };
    next.fitTrace = buildFitTrace(next);
    return next;
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

const LISTED_INSURERS = ["aetna", "bcbs", "cigna", "uhc", "oscar"];

export function paymentReady(data: OnboardingData) {
  if (data.insurance === "none") return true;
  if (data.insurance === "other") return data.otherInsurance.trim().length > 1;
  return Boolean(data.insurance && LISTED_INSURERS.includes(data.insurance));
}

export function clipboardReady(data: OnboardingData) {
  return fitReady(data) && paymentReady(data) && Boolean(data.help);
}

export function firstIncomplete(data: OnboardingData) {
  if (!clipboardReady(data)) return 0;
  if (!data.providerId || !data.slotId) return 1;
  if (infoProblems(data).length > 0) return 2;
  return null;
}

type Action = { type: "patch"; patch: Partial<OnboardingData> } | { type: "reset" };

function reducer(state: OnboardingData, action: Action): OnboardingData {
  if (action.type === "reset") return initialData();
  const next = { ...state, ...action.patch };
  if (action.patch.fitReached) next.fitReached = { ...state.fitReached, ...action.patch.fitReached };
  if (typeof action.patch.step === "number") {
    next.maxReached = Math.max(state.maxReached, action.patch.step);
  }
  next.fitTrace = buildFitTrace(next);
  return next;
}

type OnboardingApi = {
  data: OnboardingData;
  patch: (patch: Partial<OnboardingData>) => void;
  go: (step: number) => void;
  reset: () => void;
  completeBooking: (last4: string) => void;
  resume: (email: string) => "empty" | "missing" | "ok";
  reachFitQuestion: (key: FitKey) => void;
  recordSchedule: (ask: Omit<ScheduleAsk, "id" | "at">) => void;
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
      patch: {
        last4,
        booked: true,
        step: 3,
        visitPhase: "upcoming",
        visitDay: false,
        awayFromVisit: false,
        rescheduling: false,
        connectionProblem: false,
        banner: "",
      },
    });
  }, []);

  const reachFitQuestion = useCallback((key: FitKey) => {
    const current = dataRef.current;
    if (current.fitReached[key]) return;
    dispatch({ type: "patch", patch: { fitReached: { ...current.fitReached, [key]: true } } });
  }, []);

  const recordSchedule = useCallback((ask: Omit<ScheduleAsk, "id" | "at">) => {
    const current = dataRef.current;
    const entry: ScheduleAsk = { ...ask, id: `${Date.now()}-${current.scheduleAsks.length}`, at: new Date().toISOString() };
    dispatch({
      type: "patch",
      patch: { scheduleAsks: [...current.scheduleAsks, entry].slice(-40) },
    });
  }, []);

  const resume = useCallback((email: string) => {
    const current = dataRef.current;
    if (!current.email.trim()) return "empty";
    if (current.email.trim().toLowerCase() !== email.trim().toLowerCase()) return "missing";
    dispatch({
      type: "patch",
      patch: { step: current.booked ? 3 : current.maxReached, banner: "", awayFromVisit: false, rescheduling: false },
    });
    return "ok";
  }, []);

  const api = useMemo(
    () => ({ data, patch, go, reset, completeBooking, resume, reachFitQuestion, recordSchedule }),
    [data, patch, go, reset, completeBooking, resume, reachFitQuestion, recordSchedule],
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
