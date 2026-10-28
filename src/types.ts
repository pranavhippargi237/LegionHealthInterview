export type RescheduleWith = "current" | "any" | "specific";
export type YesNo = "yes" | "no" | null;
export type DayPart = "morning" | "afternoon" | "evening";
export type TimeOfDay = DayPart | null;
export type ProviderGender = "woman" | "man" | "nonbinary";
export type GenderFilter = "any" | ProviderGender;
export type ClinicianRole = "psychiatrist" | "psychiatric-np";
export type FitKey = "texas" | "medicare" | "crisis" | "hospitalized" | "adult" | "virtualOnly";
export type FitDecision = "screened_out" | "cleared" | null;
export type FitDisposition = "unfinished" | "screened_out" | "continued";

export type FitQuestionTrace = {
  reached: boolean;
  answered: YesNo;
  explicitDecision: FitDecision;
};

export type FitTrace = {
  questions: Record<FitKey, FitQuestionTrace>;
  disposition: FitDisposition;
};

export type BandCounts = {
  morning: number;
  afternoon: number;
  evening: number;
};

export type ScheduleResult = "shown" | "none_open" | "nearby" | "help" | "notify" | "booked";
export type VisitPhase = "upcoming" | "waiting" | "completed";

export type ScheduleAsk = {
  id: string;
  at: string;
  date: string | null;
  timeOfDay: DayPart;
  genders: ProviderGender[];
  onDay: BandCounts | null;
  inNext45Days: BandCounts;
  slotsInRequest: number;
  result: ScheduleResult;
};

export type OnboardingData = {
  step: number;
  maxReached: number;
  texas: YesNo;
  medicare: YesNo;
  crisis: YesNo;
  hospitalized: YesNo;
  adult: YesNo;
  virtualOnly: YesNo;
  preferredDate: string | null;
  timeOfDay: TimeOfDay;
  genderPrefs: ProviderGender[];
  languagePrefs: string[];
  backgroundPrefs: string[];
  notifyWhenOpen: boolean;
  scheduleAsks: ScheduleAsk[];
  fitReached: Record<FitKey, boolean>;
  fitContinued: boolean;
  fitTrace: FitTrace;
  conditions: string[];
  otherCondition: string;
  insurance: string | null;
  bcbsState: string;
  otherInsurance: string;
  help: string | null;
  providerId: string | null;
  slotId: string | null;
  wantEarlier: boolean;
  rescheduleWith: RescheduleWith;
  specificProviderIds: string[];
  availabilityNote: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  referral: string;
  consentTos: boolean;
  consentTreatment: boolean;
  consentRecording: boolean;
  matchReady: boolean;
  extraShown: number;
  last4: string;
  booked: boolean;
  pharmacy: string;
  visitPhase: VisitPhase;
  visitDay: boolean;
  awayFromVisit: boolean;
  rescheduling: boolean;
  connectionProblem: boolean;
  banner: string;
  visitTopics: string[];
  visitNote: string;
  visitDraft: string;
  visitWordsSnapshot: string;
  visitSharedNote: string;
  reminderChannel: "text" | "email" | null;
};

export type Slot = {
  id: string;
  date: string;
  time: string;
};

export type Provider = {
  id: string;
  name: string;
  title: string;
  role: ClinicianRole;
  gender: ProviderGender;
  languages: string[];
  backgrounds: string[];
  photo: string;
  video: string;
  credentials: string;
  rating: number;
  reviews: number;
  expertise: string[];
  about: string;
  badge?: "soonest" | "recommended";
  slots: Slot[];
};
